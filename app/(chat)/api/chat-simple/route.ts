import { convertToModelMessages } from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../../actions';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from '../chat/schema';
import { geolocation } from '@vercel/functions';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import type { ChatModel } from '@/lib/ai/models';
import type { VisibilityType } from '@/components/visibility-selector';

export const maxDuration = 60;

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

    // SIMPLE APPROACH: Direct OpenAI call with JSON response
    console.log('🤖 Using simple JSON approach...');

    try {
      // Create OpenAI client
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

      const openaiMessages = [];
      if (systemPromptText) {
        openaiMessages.push({ role: 'system', content: systemPromptText });
      }

      modelMessages.forEach((msg) => {
        openaiMessages.push({
          role: msg.role,
          content:
            typeof msg.content === 'string'
              ? msg.content
              : JSON.stringify(msg.content),
        });
      });

      console.log('🔍 Calling OpenAI API...');

      // Make the API call
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
      console.log('✅ Got response:', responseText.length, 'chars');

      // Create assistant message
      const assistantMessage = {
        id: generateUUID(),
        role: 'assistant',
        parts: [{ type: 'text', text: responseText }],
        createdAt: new Date().toISOString(),
      };

      // Save to database in background
      saveMessages({
        messages: [
          {
            chatId: id,
            id: assistantMessage.id,
            role: 'assistant',
            parts: assistantMessage.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      }).catch((error) => {
        console.log('Could not save assistant message to database');
      });

      // Return simple JSON response
      return Response.json({
        success: true,
        message: assistantMessage,
        text: responseText,
      });
    } catch (error) {
      console.error('❌ Simple API error:', error);

      return Response.json(
        {
          success: false,
          error: 'Sorry, there was an error processing your request.',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error('Unhandled error in simple chat API:', error);
    return Response.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
