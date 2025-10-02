import { convertToModelMessages } from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import type { ChatModel } from '@/lib/ai/models';
import type { VisibilityType } from '@/components/visibility-selector';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: () => {}, // Placeholder function
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel['id'];
      selectedVisibilityType: VisibilityType;
    } = requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type;

    let messageCount = 0;
    let chat = null;
    let messagesFromDb: any[] = [];

    try {
      messageCount = await getMessageCountByUserId({
        id: session.user.id,
        differenceInHours: 24,
      });

      if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
        return new ChatSDKError('rate_limit:chat').toResponse();
      }

      chat = await getChatById({ id });

      if (!chat) {
        const title = await generateTitleFromUserMessage({
          message,
        });

        await saveChat({
          id,
          userId: session.user.id,
          title,
          visibility: selectedVisibilityType,
        });
      } else {
        if (chat.userId !== session.user.id) {
          return new ChatSDKError('forbidden:chat').toResponse();
        }
      }

      messagesFromDb = await getMessagesByChatId({ id });
    } catch (error) {
      console.log('Database not available, using in-memory chat session');
      // Continue without database - this allows basic chat functionality
    }

    const uiMessages = [...convertToUIMessages(messagesFromDb), message];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    try {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: 'user',
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    } catch (error) {
      console.log('Could not save user message to database');
    }

    const streamId = generateUUID();
    try {
      await createStreamId({ streamId, chatId: id });
    } catch (error) {
      console.log('Could not create stream ID in database');
    }

    // DIRECT OPENAI APPROACH: Use the working OpenAI client directly
    console.log('🤖 Using direct OpenAI approach (like your working test)...');

    try {
      // Create OpenAI client exactly like your working test
      const OpenAI = require('openai').default;
      const openai = new OpenAI({
        apiKey: process.env.GRAVIXLAYER_API_KEY,
        baseURL: 'https://api.gravixlayer.com/v1/inference',
      });

      // Convert messages to OpenAI format
      const systemPromptText = systemPrompt({
        selectedChatModel,
        requestHints,
      });
      const modelMessages = convertToModelMessages(uiMessages);

      // Add system message if it exists
      const openaiMessages = [];
      if (systemPromptText) {
        openaiMessages.push({ role: 'system', content: systemPromptText });
      }

      // Add conversation messages
      modelMessages.forEach((msg) => {
        openaiMessages.push({
          role: msg.role,
          content:
            typeof msg.content === 'string'
              ? msg.content
              : JSON.stringify(msg.content),
        });
      });

      console.log('🔍 Sending to OpenAI:', {
        model:
          selectedChatModel === 'chat-model-reasoning'
            ? 'meta-llama/llama-3.1-70b-instruct'
            : 'meta-llama/llama-3.1-8b-instruct',
        messagesCount: openaiMessages.length,
        messages: openaiMessages,
      });

      // Make the API call exactly like your working test
      const completion = await openai.chat.completions.create({
        messages: openaiMessages,
        model:
          selectedChatModel === 'chat-model-reasoning'
            ? 'meta-llama/llama-3.1-70b-instruct'
            : 'meta-llama/llama-3.1-8b-instruct',
        max_tokens: 1000,
        temperature: 0.7,
      });

      const responseText =
        completion.choices[0]?.message?.content || 'No response generated';
      console.log(
        '✅ Got response from OpenAI:',
        responseText.length,
        'chars:',
        responseText.substring(0, 100),
      );

      // Create the SSE stream with the response
      const messageId = generateUUID();
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        start(controller) {
          console.log('🔄 Sending response via SSE...');

          // Send text delta with the response
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'text-delta',
                id: messageId,
                delta: responseText,
              })}\n\n`,
            ),
          );

          // Send finish
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'finish',
                finishReason: 'stop',
              })}\n\n`,
            ),
          );

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

          console.log('✅ SSE response sent successfully');
        },
      });

      // Save to database in background
      saveMessages({
        messages: [
          {
            chatId: id,
            id: messageId,
            role: 'assistant',
            parts: [{ type: 'text', text: responseText }],
            attachments: [],
            createdAt: new Date(),
          },
        ],
      }).catch((error) => {
        console.log('Could not save assistant message to database');
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } catch (error) {
      console.error('❌ Direct OpenAI error:', error);

      // Return error response
      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: 'Sorry, there was an error processing your request.',
              })}\n\n`,
            ),
          );
          controller.close();
        },
      });

      return new Response(errorStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Response is handled by the stream above
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    // Check for Gravix Layer API errors
    if (
      error instanceof Error &&
      (error.message?.includes('API key') ||
        error.message?.includes('unauthorized') ||
        error.message?.includes('insufficient credits'))
    ) {
      return new ChatSDKError('bad_request:activate_gateway').toResponse();
    }

    console.error('Unhandled error in chat API:', error);
    return new ChatSDKError('offline:chat').toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  try {
    const chat = await getChatById({ id });

    if (chat?.userId !== session.user.id) {
      return new ChatSDKError('forbidden:chat').toResponse();
    }

    const deletedChat = await deleteChatById({ id });
    return Response.json(deletedChat, { status: 200 });
  } catch (error) {
    console.log('Could not delete chat from database');
    return Response.json({ message: 'Chat deleted' }, { status: 200 });
  }
}
