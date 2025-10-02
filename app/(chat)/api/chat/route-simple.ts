import OpenAI from 'openai';
import { auth } from '@/app/(auth)/auth';
import { generateUUID } from '@/lib/utils';
import { ChatSDKError } from '@/lib/errors';

// Direct Gravix Layer integration
const gravixOpenAI = new OpenAI({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
  baseURL: 'https://api.gravixlayer.com/v1/inference',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, selectedChatModel } = body;

    const session = await auth();
    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const modelName =
      selectedChatModel === 'chat-model-reasoning'
        ? 'meta-llama/llama-3.1-70b-instruct'
        : 'meta-llama/llama-3.1-8b-instruct';

    console.log('🤖 Calling Gravix Layer with model:', modelName);
    console.log('📝 Message:', message.parts[0].text);

    const completion = await gravixOpenAI.chat.completions.create({
      model: modelName,
      messages: [{ role: 'user', content: message.parts[0].text }],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content || 'No response';

    console.log(
      '✅ Gravix Layer response:',
      responseText.substring(0, 100) + '...',
    );

    const responseData = {
      id: generateUUID(),
      role: 'assistant',
      content: responseText,
      createdAt: new Date().toISOString(),
    };

    return Response.json(responseData, { status: 200 });
  } catch (error) {
    console.error('❌ Chat API error:', error);
    return new ChatSDKError('offline:chat').toResponse();
  }
}

export async function DELETE(request: Request) {
  return Response.json(
    { message: 'Delete not implemented in simple version' },
    { status: 200 },
  );
}
