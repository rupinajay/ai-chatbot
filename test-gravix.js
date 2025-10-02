// Simple test script to verify Gravix Layer integration
// Run with: node test-gravix.js

const OpenAI = require('openai').default;
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
  baseURL: 'https://api.gravixlayer.com/v1/inference',
});

async function testGravixLayer() {
  console.log('🧪 Testing Gravix Layer integration...');

  if (!process.env.GRAVIXLAYER_API_KEY) {
    console.error('❌ GRAVIXLAYER_API_KEY not found in .env.local');
    process.exit(1);
  }

  if (process.env.GRAVIXLAYER_API_KEY === 'your-gravix-layer-api-key-here') {
    console.error(
      '❌ Please set your actual Gravix Layer API key in .env.local',
    );
    process.exit(1);
  }

  try {
    console.log('📡 Making request to Gravix Layer...');

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: 'Hello! Please respond with "Gravix Layer is working!"',
        },
      ],
      model: 'meta-llama/llama-3.1-8b-instruct',
      max_tokens: 50,
    });

    console.log('✅ Success! Response from Gravix Layer:');
    console.log('📝', completion.choices[0].message.content);
    console.log('🔧 Model used:', completion.model);
    console.log('📊 Usage:', completion.usage);
  } catch (error) {
    console.error('❌ Error testing Gravix Layer:');
    console.error(error.message);

    if (error.message.includes('API key')) {
      console.log('💡 Check your GRAVIXLAYER_API_KEY in .env.local');
    }
    if (error.message.includes('model')) {
      console.log(
        '💡 The model "meta-llama/llama-3.1-8b-instruct" might not be available',
      );
    }
  }
}

testGravixLayer();
