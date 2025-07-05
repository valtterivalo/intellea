/**
 * @fileoverview API route for chat messages via agents.
 * Exports POST.
 */
import { NextRequest, NextResponse } from 'next/server';
import { run } from '@openai/agents';
import { RouterAgent } from '@/lib/agents/router';
import type { AgentInputItem } from '@openai/agents-core';
import { verifyUserAccess } from '@/lib/api-helpers';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(req: NextRequest) {
  // Add subscription verification
  const { error } = await verifyUserAccess();
  if (error) {
    return error;
  }

  const { messages } = (await req.json()) as { messages: Message[] };

  if (!process.env.OPENAI_API_KEY) {
    const last = messages[messages.length - 1];
    const reply = `echo: ${last?.content ?? ''}`;
    return new Response(reply, {
      headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' }
    });
  }

  // Convert messages to AgentInputItem format
  const agentInput: AgentInputItem[] = messages.map((m): AgentInputItem => {
    if (m.role === 'assistant') {
        return {
            type: 'message',
            role: 'assistant',
            content: [{ type: 'output_text', text: m.content }],
            status: 'completed'
        }
    }
    // For user and system, content can be a string.
    // The cast to `any` is a workaround for a slight type mismatch in the SDK where
    // user message content is string | UserContent[] but the discriminated union
    // resolver has trouble with the string case when mixed with other item types.
    return {
      type: 'message',
      role: m.role,
      content: m.content,
    } as AgentInputItem;
  });

  try {
    const resultStream = await run(RouterAgent, agentInput, { stream: true });

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const event of resultStream.toTextStream()) {
          controller.enqueue(encoder.encode(event));
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error running chat agent:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
