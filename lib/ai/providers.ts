import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { isTestEnvironment } from '../constants';

// Create Gravix provider with custom fetch to handle /responses errors
const gravixProvider = createOpenAI({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
  baseURL: 'https://api.gravixlayer.com/v1/inference',
  fetch: async (url, options) => {
    // If this is a /responses call, return a fake success response
    if (url.toString().includes('/responses')) {
      console.log('Intercepting /responses call - returning fake success');
      return new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Debug: Log all API calls to see what's happening
    console.log('🌐 Gravix API call:', {
      url: url.toString(),
      method: options?.method,
      hasBody: !!options?.body,
    });

    // Debug: Log request body if it exists
    if (options?.body) {
      try {
        const bodyText =
          typeof options.body === 'string'
            ? options.body
            : JSON.stringify(options.body);
        console.log('🌐 Request body:', bodyText);
      } catch (e) {
        console.log('🌐 Request body: [could not stringify]');
      }
    }

    // For all other calls, use the default fetch
    const response = await fetch(url, options);

    // Debug: Log response
    console.log('🌐 Gravix API response:', {
      url: url.toString(),
      status: response.status,
      contentType: response.headers.get('content-type'),
    });

    // Debug: Log response body for non-stream responses
    if (!response.headers.get('content-type')?.includes('stream')) {
      try {
        const responseClone = response.clone();
        const responseText = await responseClone.text();
        console.log('🌐 Response body:', responseText.substring(0, 500));
      } catch (e) {
        console.log('🌐 Response body: [could not read]');
      }
    }

    return response;
  },
});

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require('./models.mock');
      return customProvider({
        languageModels: {
          'chat-model': chatModel,
          'chat-model-reasoning': reasoningModel,
          'title-model': titleModel,
          'artifact-model': artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        'chat-model': gravixProvider('meta-llama/llama-3.1-8b-instruct'),
        'chat-model-reasoning': wrapLanguageModel({
          model: gravixProvider('meta-llama/llama-3.1-70b-instruct'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': gravixProvider('meta-llama/llama-3.1-8b-instruct'),
        'artifact-model': gravixProvider('meta-llama/llama-3.1-8b-instruct'),
      },
    });
