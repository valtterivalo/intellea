import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface Params {
  sessionId: string;
}

// POST handler to lookup an expanded concept by criteria (avoiding URL query param issues)
export async function POST(request: Request, { params }: { params: Params }) {
  const { sessionId } = params;
  const supabase = createClient();

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  try {
    // Parse request body
    const payload = await request.json();
    const { nodeId, graphHash } = payload;

    if (!nodeId) {
      return NextResponse.json({ error: 'nodeId is required' }, { status: 400 });
    }

    if (!graphHash) {
      return NextResponse.json({ error: 'graphHash is required' }, { status: 400 });
    }

    // Verify user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json({ error: 'Error retrieving session' }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

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

    // Look up the expanded concept using a direct query instead of REST API
    console.log(`Looking up expanded concept: sessionId=${sessionId}, nodeId=${nodeId}, graphHash=${graphHash.substring(0, 10)}...`);
    
    const { data: expandedConcept, error: lookupError } = await supabase
      .from('expanded_concepts')
      .select('*')
      .eq('session_id', sessionId)
      .eq('node_id', nodeId)
      .eq('graph_hash', graphHash)
      .single();

    if (lookupError) {
      if (lookupError.code === 'PGRST116') {
        // Not found is normal - return empty for further processing
        return NextResponse.json({ found: false });
      }
      
      // Other errors should be reported
      console.error('Error looking up expanded concept:', lookupError);
      return NextResponse.json({ 
        error: `Error looking up expanded concept: ${lookupError.message}` 
      }, { status: 500 });
    }

    if (!expandedConcept) {
      return NextResponse.json({ found: false });
    }

    // Transform the response to match the client's expected format
    return NextResponse.json({
      found: true,
      data: {
        nodeId: expandedConcept.node_id,
        title: expandedConcept.title,
        content: expandedConcept.content,
        relatedConcepts: expandedConcept.related_concepts,
        graphHash: expandedConcept.graph_hash
      }
    });

  } catch (error: any) {
    console.error(`Unexpected error in expanded concepts lookup:`, error);
    return NextResponse.json({ 
      error: `An unexpected error occurred: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
} 