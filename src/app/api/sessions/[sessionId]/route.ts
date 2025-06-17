import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { IntelleaResponse } from '@/store/useAppStore';

interface Params {
  sessionId: string;
}

// GET handler for a specific session
export async function GET(request: Request, { params }: { params: Params }) {
  const { sessionId } = params;
  const supabase = await createClient();

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  try {
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

    // Fetch the specific session for the logged-in user
    const { data: sessionData, error: selectError } = await supabase
      .from('sessions')
      .select('id, title, session_data, last_prompt') // Fetch all relevant fields
      .eq('id', sessionId) // Match the session ID from the URL
      .eq('user_id', userId) // IMPORTANT: Ensure the session belongs to the user
      .single(); // Expect exactly one result or null

    if (selectError) {
      // Differentiate between 'not found' and other errors if possible
      // Supabase might return a specific code for PGROST016 (0 rows)
      if (selectError.code === 'PGRST116') {
          if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log(`Session not found or user mismatch: ${sessionId} for user ${userId}`);
          return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
      }
      console.error(`Error fetching session ${sessionId}:`, selectError);
      return NextResponse.json({ error: 'Failed to fetch session data' }, { status: 500 });
    }

    if (!sessionData) {
      // This case might be redundant due to .single() error handling above, but good for clarity
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Return the full session data
    return NextResponse.json(sessionData);

  } catch (error) {
    console.error(`Unexpected error in GET /api/sessions/${sessionId}:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// We will add PUT and DELETE handlers here later 

// PUT handler to update/save a specific session
export async function PUT(request: Request, { params }: { params: Params }) {
  const { sessionId } = params;
  const supabase = await createClient();

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  // --- Payload Validation ---
  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // Validate required fields (adjust based on what frontend sends)
  // We expect session_data, title, and last_prompt
  const { session_data, title, last_prompt } = payload;
  if (!session_data || typeof title !== 'string' || typeof last_prompt !== 'string') {
    // Be more specific in validation if needed (e.g., check session_data structure)
    return NextResponse.json({ error: 'Missing required fields: session_data, title, last_prompt' }, { status: 400 });
  }

  try {
    // --- Authentication ---
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // --- Authorization & Update ---
    // The DB trigger handles last_updated_at automatically
    const { data, error: updateError } = await supabase
      .from('sessions')
      .update({
        session_data: session_data as any, // Cast to any to bypass strict type check
        title: title,
        last_prompt: last_prompt,
        // last_updated_at is handled by trigger
      })
      .eq('id', sessionId)
      .eq('user_id', userId) // IMPORTANT: Ensure user owns the session
      .select('id') // Select something to confirm the update happened
      .single(); // Use single to check if exactly one row was updated

    if (updateError) {
      // Check if the error is due to row not found (implies wrong session ID or user mismatch)
      // The error code might vary, PGRST116 is common for no rows matching filters.
      if (updateError.code === 'PGRST116') {
          if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log(`Update failed: Session not found or user mismatch: ${sessionId} for user ${userId}`);
          return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
      }
      // Log other update errors
      console.error(`Error updating session ${sessionId}:`, updateError);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    // If data is null here after .single(), it means the row wasn't found/updated.
    // This check might be redundant given the error handling above but adds safety.
     if (!data) {
         console.warn(`Update seemed successful but no data returned for session ${sessionId}`);
         // Consider if 404 is more appropriate if the update didn't affect any row
         return NextResponse.json({ error: 'Session not found or update failed' }, { status: 404 });
     }

    // --- Success Response ---
    // Return minimal confirmation or the updated fields if needed by frontend
    return NextResponse.json({ message: 'Session updated successfully', id: data.id }, { status: 200 });

  } catch (error) {
    // Catch unexpected errors like JSON parsing issues handled above or others
    console.error(`Unexpected error in PUT /api/sessions/${sessionId}:`, error);
    // Avoid leaking detailed error messages to the client unless necessary
    if (error instanceof SyntaxError) { // Specifically catch JSON parsing errors if not caught earlier
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE handler for a specific session
export async function DELETE(request: Request, { params }: { params: Params }) {
  const { sessionId } = params;
  const supabase = await createClient();

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  try {
    // --- Authentication ---
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // --- Authorization & Deletion ---
    // Attempt to delete the session matching BOTH id and user_id
    const { error: deleteError, count } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId); // IMPORTANT: Ensure user owns the session

    if (deleteError) {
      // Log unexpected delete errors
      console.error(`Error deleting session ${sessionId}:`, deleteError);
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }

    // Check if any row was actually deleted
    // Supabase delete() might return a count. If count is 0, the session wasn't found or didn't belong to the user.
    if (count === 0) {
        if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log(`Delete failed: Session not found or user mismatch: ${sessionId} for user ${userId}`);
        // Return 404 Not Found if no rows were deleted
        return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

     // If deletion was successful (count > 0 or no error and count not checked)
     // Return 204 No Content, standard for successful DELETE with no body
    return new NextResponse(null, { status: 204 });

  } catch (error) {
    // Catch unexpected errors
    console.error(`Unexpected error in DELETE /api/sessions/${sessionId}:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 