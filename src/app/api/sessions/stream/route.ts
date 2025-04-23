import { NextRequest } from 'next/server'
import { OpenAIApi, Configuration } from 'openai'

// ... existing code (if any) ...

export async function POST(req: NextRequest) {
  try {
    // 1. Parse incoming request for user messages/prompt
    const { messages } = await req.json()

    // 2. Create the OpenAI client
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    })
    const openai = new OpenAIApi(configuration)

    // 3. Set up the response headers for SSE
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        // 4. Make the streaming call to OpenAI
        const completion = await openai.createChatCompletion(
          {
            model: 'gpt-3.5-turbo',
            messages: messages,
            stream: true
          },
          { responseType: 'stream' }
        )

        // 5. Read and push chunks out as SSE
        for await (const chunk of completion.data as any) {
          // Extract the streamed text token
          const content = chunk.choices?.[0]?.delta?.content || ''
          const queue = encoder.encode(`data: ${content}\n\n`)
          controller.enqueue(queue)
        }

        // 6. Signal we’re done
        const doneQueue = encoder.encode('data: [DONE]\n\n')
        controller.enqueue(doneQueue)
        controller.close()
      }
    })

    // 7. Return the streaming response
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive'
      }
    })
  } catch (err: any) {
    // Return an error response if needed
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}