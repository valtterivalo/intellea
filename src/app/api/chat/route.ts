import { NextRequest } from 'next/server';
import OpenAI from 'openai';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// fallback: if no openai key just echo
function echoStream(messages: Message[]) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const last = messages[messages.length - 1];
      const reply = `echo: ${last?.content ?? ''}`;
      controller.enqueue(encoder.encode(reply));
      controller.close();
    }
  });
}

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: Message[] };

  // use openai if key exists
  if (!process.env.OPENAI_API_KEY) {
    return new Response(echoStream(messages), {
      headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' }
    });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const responseStream = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    stream: true,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });

  const encoder = new TextEncoder();

  const readableStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of responseStream) {
          const token = chunk.choices[0]?.delta?.content;
          if (token) controller.enqueue(encoder.encode(token));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
    },
  });
}
