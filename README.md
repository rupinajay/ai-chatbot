<a href="https://gravixlayer.com/">
  <img alt="Next.js 15 and App Router-ready AI chatbot powered by Gravix Layer." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Gravix Layer Chat</h1>
</a>

<p align="center">
    A powerful AI chatbot built with Next.js and the AI SDK, powered by Gravix Layer's open-source model inference platform.
</p>

<p align="center">
  <a href="QUICK_START.md"><strong>Quick Start</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="GRAVIX_SETUP.md"><strong>Full Setup</strong></a> ·
  <a href="#testing"><strong>Testing</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://ai-sdk.dev/docs/introduction)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports xAI (default), OpenAI, Fireworks, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Neon Serverless Postgres](https://vercel.com/marketplace/neon) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- [Auth.js](https://authjs.dev)
  - Simple and secure authentication

## Model Providers

This template uses [Gravix Layer](https://gravixlayer.com/) to access multiple open-source AI models through their inference platform. The default configuration includes Meta's Llama models (`meta-llama/llama-3.1-8b-instruct`, `meta-llama/llama-3.1-70b-instruct`).

### Gravix Layer Authentication

You need to provide a Gravix Layer API key by setting the `GRAVIXLAYER_API_KEY` environment variable in your `.env.local` file. Get your API key from [Gravix Layer's documentation](https://docs.gravixlayer.com/docs/getting-started).

Gravix Layer provides access to many open-source models with OpenAI-compatible APIs, making it easy to switch between different models with just a configuration change.

## Deploy Your Own

You can deploy your own version of the Next.js AI Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/templates/next.js/nextjs-ai-chatbot)

## Running locally

## Quick Start

1. **Get your Gravix Layer API key** from [Gravix Layer Documentation](https://docs.gravixlayer.com/docs/getting-started)

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your `GRAVIXLAYER_API_KEY` and other required variables.

3. **Install and run**:
   ```bash
   pnpm install
   pnpm dev
   ```

Your Gravix Layer-powered chatbot will be running on [localhost:3000](http://localhost:3000).

📖 **For detailed setup instructions, see [GRAVIX_SETUP.md](GRAVIX_SETUP.md)**

## Testing

Test your Gravix Layer integration:

```bash
pnpm run test:gravix
```

This will verify your API key and model access.

> Note: You should not commit your `.env.local` file as it contains sensitive API keys.
