# Quick Start - Test Gravix Layer Integration

This guide helps you quickly test the Gravix Layer integration without setting up a full database.

## 1. Get Your Gravix Layer API Key

1. Visit [Gravix Layer Documentation](https://docs.gravixlayer.com/docs/getting-started)
2. Sign up and get your API key

## 2. Minimal Setup

Update your `.env.local` file with just the essentials:

```env
AUTH_SECRET=development-secret-key-change-in-production
GRAVIXLAYER_API_KEY=your-actual-gravix-layer-api-key-here
```

## 3. Test the Integration

```bash
pnpm install
pnpm dev
```

## 4. What Works Without Database

- ✅ Basic chat functionality with Gravix Layer models
- ✅ Streaming responses
- ✅ Model selection (Llama 3.1 8B and 70B)
- ✅ Artifact creation (code, text, sheets)
- ❌ Chat history (requires database)
- ❌ User authentication (requires database)
- ❌ File uploads (requires blob storage)

## 5. Testing the Chat

1. Go to http://localhost:3000
2. You'll see some database errors in the console (expected without database)
3. The chat interface should still work for basic conversations
4. Try asking: "Write a Python function to calculate fibonacci numbers"
5. The response should come from Gravix Layer's Llama models

## 6. Verify Gravix Layer Integration

Check the browser's Network tab or server logs to confirm requests are going to:
`https://api.gravixlayer.com/v1/inference`

## Next Steps

For full functionality, set up:
- PostgreSQL database for chat history and users
- Vercel Blob for file uploads
- Redis for resumable streams

See [GRAVIX_SETUP.md](GRAVIX_SETUP.md) for complete setup instructions.