import OpenAI from 'openai';
import { generateUUID } from '@/lib/utils';

export const runtime = 'edge';
export const preferredRegion = 'home';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    console.log('📨 Received messages:', JSON.stringify(messages, null, 2));

    // Transform messages from the frontend format (with 'parts') to simple format
    const transformedMessages = messages.map((message: any) => ({
      role: message.role,
      content: message.parts
        ? message.parts.map((part: any) => part.text).join('')
        : message.content,
    }));

    console.log('🔄 Transformed messages:', JSON.stringify(transformedMessages, null, 2));

    // Use the native OpenAI client to call your custom endpoint directly
    const openaiClient = new OpenAI({
      apiKey: process.env.GRAVIXLAYER_API_KEY || '',
      baseURL: 'https://api.gravixlayer.com/v1/inference',
    });

    console.log('🚀 Calling Gravixlayer API...');

    // Call the chat completions endpoint with streaming
    const stream = await openaiClient.chat.completions.create({
      model: 'meta-llama/llama-3.1-8b-instruct',
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant.' },
        ...transformedMessages,
      ],
      stream: true,
    });

    console.log('✅ Got streaming response from Gravixlayer');

    // Create the SSE stream in the AI SDK format
    const messageId = generateUUID();
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          console.log('🔄 Starting SSE stream...');

          // Send start event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'start',
                messageId: messageId,
              })}\n\n`,
            ),
          );

          // Send text-start event
          const textId = generateUUID();
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'text-start',
                id: textId,
              })}\n\n`,
            ),
          );

          // Stream text deltas
          let fullText = '';
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              fullText += content;
              console.log('📦 Streaming chunk:', content);
              
              // Send text-delta event
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'text-delta',
                    id: textId,
                    delta: content,
                  })}\n\n`,
                ),
              );
            }
          }

          console.log('✅ Stream completed. Full text:', fullText);

          // Send text-end event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'text-end',
                id: textId,
              })}\n\n`,
            ),
          );

          // Send finish event (no finishReason field)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'finish',
              })}\n\n`,
            ),
          );

          // Send [DONE] marker
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

          console.log('✅ SSE stream finished successfully');
        } catch (error) {
          console.error('❌ Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('❌ Error in inmemory route:', error);
    
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
