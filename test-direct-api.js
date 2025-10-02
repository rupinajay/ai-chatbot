// Test Gravix Layer API directly without the web app
const { config } = require('dotenv');
config({ path: '.env.local' });

async function testDirectAPI() {
  console.log('🧪 Testing Gravix Layer API directly...');

  try {
    const OpenAI = require('openai').default;
    const openai = new OpenAI({
      apiKey: process.env.GRAVIXLAYER_API_KEY,
      baseURL: 'https://api.gravixlayer.com/v1/inference',
    });

    console.log('📡 Making direct API call...');

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: 'Hello! Say "Direct API working!"' }],
      model: 'meta-llama/llama-3.1-8b-instruct',
      max_tokens: 50,
    });

    console.log('✅ Direct API Success!');
    console.log('📝 Response:', completion.choices[0].message.content);
    console.log('🔧 Model:', completion.model);
    console.log('📊 Usage:', completion.usage);

    console.log('\n🎯 The issue is NOT with Gravix Layer API');
    console.log('🔍 The issue is with the web app integration');
  } catch (error) {
    console.error('❌ Direct API failed:', error.message);
  }
}

testDirectAPI();
