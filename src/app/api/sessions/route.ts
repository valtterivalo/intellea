/**
 * @fileoverview API route to fetch current user session list.
 * Exports GET.
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  try {
    // Get the current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json({ error: 'Error retrieving session' }, { status: 500 });
    }

    if (!session) {
      // If no session, return an empty array or 401 depending on desired behavior for logged-out users
      // Returning empty array might be better for initial dashboard load before login state is fully confirmed?
      // Or strict 401 might be cleaner. Let's go with 401 for now.
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch sessions for the logged-in user
    // Select only the necessary columns for the list view
    const { data: sessions, error: selectError } = await supabase
      .from('sessions')
      .select('id, title, last_updated_at, last_prompt')
      .eq('user_id', userId)
      .order('last_updated_at', { ascending: false }); // Show newest first

    if (selectError) {
      // Log the actual error for debugging on the server
      console.error('Error fetching sessions:', selectError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // Return the list of sessions, ensuring it's an array even if null/empty
    return NextResponse.json(sessions ?? []);

  } catch (error) {
    // Catch unexpected errors during the process
    console.error('Unexpected error in GET /api/sessions:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST handler to create a new session
export async function POST() {
  const supabase = await createClient();

  try {
    // Get the current user session
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

    // We could potentially allow passing an initial title in the body,
    // but for now, we'll just create one with the default title.
    // const body = await request.json().catch(() => ({})); // Optional: parse body for title
    // const initialTitle = body.title || 'Untitled Session';

    // Insert a new session for the logged-in user with the default title
    const { data: newSession, error: insertError } = await supabase
      .from('sessions')
      .insert({ user_id: userId }) // Defaults defined in DB schema handle title, timestamps etc.
      .select('id, title') // Select the ID and title of the new session
      .single(); // Expect only one row to be created

    if (insertError) {
      console.error('Error creating new session:', insertError);
      return NextResponse.json({ error: 'Failed to create new session' }, { status: 500 });
    }

    // Return the ID and title of the newly created session
    return NextResponse.json(newSession, { status: 201 }); // 201 Created status

  } catch (error) {
    console.error('Unexpected error in POST /api/sessions:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// We will add POST handler here later 
