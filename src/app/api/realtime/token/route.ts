/**
 * @fileoverview API route handlers.
 * Exports: POST
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 500 });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const session = await openai.beta.realtime.sessions.create({
      model: 'gpt-4o-realtime-preview',
      // I can also add tracing here later
    });

    return NextResponse.json({ token: session.client_secret.value });
  } catch (error) {
    console.error('Error creating realtime session token:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Failed to create realtime session: ${errorMessage}` }, { status: 500 });
  }
} 