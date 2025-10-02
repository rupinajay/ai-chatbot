# Gravix Layer Setup Guide

This chatbot is now configured to use Gravix Layer's AI inference platform. Follow these steps to get started:

## 1. Get Your Gravix Layer API Key

1. Visit [Gravix Layer Documentation](https://docs.gravixlayer.com/docs/getting-started)
2. Sign up for an account if you haven't already
3. Generate your API key from the dashboard

## 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Update the following variables in `.env.local`:

```env
# Required for Gravix Layer
GRAVIXLAYER_API_KEY=your-gravix-layer-api-key-here

# Required for authentication
AUTH_SECRET=your-random-secret-here

# Required for file storage (optional for basic chat)
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# Required for chat history (optional for basic chat)
POSTGRES_URL=your-postgres-connection-string

# Required for resumable streams (optional)
REDIS_URL=your-redis-connection-string
```

## 3. Available Models

The chatbot is configured with these Gravix Layer models:

- **Llama 3.1 8B** (`meta-llama/llama-3.1-8b-instruct`) - Fast and efficient for general conversations
- **Llama 3.1 70B** (`meta-llama/llama-3.1-70b-instruct`) - Enhanced reasoning capabilities

## 4. Usage Example

Here's how Gravix Layer integration works under the hood:

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
  baseURL: "https://api.gravixlayer.com/v1/inference"
});

const completion = await openai.chat.completions.create({
  messages: [{ role: "user", content: "Hello" }],
  model: "meta-llama/llama-3.1-8b-instruct",
});
```

## 5. Run the Application

```bash
pnpm install
pnpm dev
```

Your Gravix Layer-powered chatbot will be available at [http://localhost:3000](http://localhost:3000).

## Features

- ✅ OpenAI-compatible API integration with Gravix Layer
- ✅ Multiple Llama model support
- ✅ Streaming responses
- ✅ Chat history (with database)
- ✅ File attachments (with blob storage)
- ✅ Authentication
- ✅ Responsive design with shadcn/ui
- ✅ Dark/light theme support

## Troubleshooting

If you encounter issues:

1. **API Key Issues**: Ensure your `GRAVIXLAYER_API_KEY` is correct and has sufficient credits
2. **Model Not Found**: Verify the model name matches Gravix Layer's available models
3. **Connection Issues**: Check that `https://api.gravixlayer.com/v1/inference` is accessible

For more help, visit [Gravix Layer Documentation](https://docs.gravixlayer.com/).