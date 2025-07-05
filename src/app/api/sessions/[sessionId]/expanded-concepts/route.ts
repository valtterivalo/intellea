/**
 * @fileoverview API route handlers.
 * Exports: DELETE, GET, POST
 */
import { NextResponse } from 'next/server';
import { createClient as createRedisClient } from '@/lib/redis';
import { createClient } from '@/lib/supabase/server';

interface Params {
  sessionId: string;
}

// GET handler to fetch all expanded concepts for a specific session
export async function GET(request: Request, { params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const { sessionId } = resolvedParams;
  const supabase = await createClient();
  const redis = createRedisClient();

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  try {
    // Verify user session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.json({ error: 'Error retrieving user session' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // First verify the session belongs to the user
    const { data: sessionData, error: sessionCheckError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionCheckError || !sessionData) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // Fetch all expanded concepts for the session from Supabase (to get graph hashes)
    const { data: expandedConcepts, error: fetchError } = await supabase
      .from('expanded_concepts')
      .select('*')
      .eq('session_id', sessionId);

    if (fetchError) {
      console.error(`Error fetching expanded concepts for session ${sessionId}:`, fetchError);
      return NextResponse.json({ error: 'Failed to fetch expanded concepts' }, { status: 500 });
    }

    // Try to fetch from Redis in batch
    const cacheKeys = expandedConcepts.map(concept => `expand:${sessionId}:${concept.graph_hash}`);
    let cachedResults: (string | null)[] = [];
    if (cacheKeys.length > 0) {
      cachedResults = await redis.mget(...cacheKeys);
    }

    // Use cached value if available, otherwise fall back to DB value
    const formattedConcepts = expandedConcepts.map((concept, idx) => {
      const cached = cachedResults[idx];
      if (cached) {
        try {
          // Parse and return the cached expanded concept
          const parsed = JSON.parse(cached);
          return {
            nodeId: concept.node_id,
            title: parsed.title,
            content: parsed.content,
            relatedConcepts: parsed.relatedConcepts,
            graphHash: concept.graph_hash
          };
        } catch {
          // If cache is corrupted, fall back to DB value
        }
      }
      // Fallback to DB value
      return {
        nodeId: concept.node_id,
        title: concept.title,
        content: concept.content,
        relatedConcepts: concept.related_concepts,
        graphHash: concept.graph_hash
      };
    });

    return NextResponse.json({ expandedConcepts: formattedConcepts });

  } catch (error) {
    console.error(`Unexpected error in GET /api/sessions/${sessionId}/expanded-concepts:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST handler to create a new expanded concept for a specific session
export async function POST(request: Request, { params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const { sessionId } = resolvedParams;
  const supabase = await createClient();

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  // Parse request body
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // Validate required fields
  const { nodeId, title, content, relatedConcepts, graphHash } = payload;
  
  if (!nodeId) {
    return NextResponse.json({ error: 'Missing required field: nodeId' }, { status: 400 });
  }
  
  if (!title) {
    return NextResponse.json({ error: 'Missing required field: title' }, { status: 400 });
  }
  
  if (!content) {
    return NextResponse.json({ error: 'Missing required field: content' }, { status: 400 });
  }
  
  if (!Array.isArray(relatedConcepts)) {
    return NextResponse.json({ error: 'Missing or invalid required field: relatedConcepts (must be an array)' }, { status: 400 });
  }
  
  if (!graphHash) {
    return NextResponse.json({ error: 'Missing required field: graphHash' }, { status: 400 });
  }
  
  // Validate graph hash format (for SHA-256 this would be a 64 character hex string)
  // But allow for fallback hash formats as well
  if (typeof graphHash !== 'string') {
    return NextResponse.json({ error: 'Invalid graphHash: must be a string' }, { status: 400 });
  }

  try {
    // Verify user session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // First verify the session belongs to the user
    const { data: sessionData, error: sessionCheckError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionCheckError || !sessionData) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // Check if this expanded concept already exists
    const { data: existingConcept } = await supabase
      .from('expanded_concepts')
      .select('id')
      .eq('session_id', sessionId)
      .eq('node_id', nodeId)
      .eq('graph_hash', graphHash)
      .single();

    if (existingConcept) {
      // If it exists, update it using PUT logic
      const { data: updatedConcept, error: updateError } = await supabase
        .from('expanded_concepts')
        .update({
          title,
          content,
          related_concepts: relatedConcepts,
          graph_hash: graphHash
        })
        .eq('id', existingConcept.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating expanded concept:', updateError);
        return NextResponse.json({ error: 'Failed to update expanded concept' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Expanded concept updated',
        id: updatedConcept.id
      });
    }

    // Create a new expanded concept record
    const { data: newConcept, error: insertError } = await supabase
      .from('expanded_concepts')
      .insert({
        session_id: sessionId,
        node_id: nodeId,
        title,
        content,
        related_concepts: relatedConcepts,
        graph_hash: graphHash
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating expanded concept:', insertError);
      return NextResponse.json({ error: 'Failed to create expanded concept' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Expanded concept created',
      id: newConcept.id
    }, { status: 201 });

  } catch (error) {
    console.error(`Unexpected error in POST /api/sessions/${sessionId}/expanded-concepts:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE handler to remove an expanded concept by node ID
export async function DELETE(request: Request, { params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const { sessionId } = resolvedParams;
  const supabase = await createClient();
  const url = new URL(request.url);
  const nodeId = url.searchParams.get('nodeId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  if (!nodeId) {
    return NextResponse.json({ error: 'Node ID is required as a query parameter' }, { status: 400 });
  }

  try {
    // Verify user session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // First verify the session belongs to the user
    const { data: sessionData, error: sessionCheckError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionCheckError || !sessionData) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // Delete the expanded concept
    const { error: deleteError } = await supabase
      .from('expanded_concepts')
      .delete()
      .eq('session_id', sessionId)
      .eq('node_id', nodeId);

    if (deleteError) {
      console.error('Error deleting expanded concept:', deleteError);
      return NextResponse.json({ error: 'Failed to delete expanded concept' }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error(`Unexpected error in DELETE /api/sessions/${sessionId}/expanded-concepts:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
