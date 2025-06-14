import { RouterAgent } from 'backend';
import { NextRequest } from 'next/server';

interface Message {
  role: string;
  content: string;
}

export async function POST(req: NextRequest) {
  const { Runner } = await import('backend');
  const { messages } = (await req.json()) as { messages: Message[] };

  // TODO: obtain real context if available
  const context: Record<string, unknown> = {};

  const agentStream = Runner.run_stream(RouterAgent, { input: messages, context });
  const encoder = new TextEncoder();
  const readableStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for await (const chunk of agentStream) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    }
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    }
  });
}
