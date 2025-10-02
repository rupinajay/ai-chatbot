// Simple test without hanging
const { config } = require('dotenv');
config({ path: '.env.local' });

console.log('🧪 Testing Gravix Layer API directly...');

const OpenAI = require('openai').default;
const openai = new OpenAI({
  apiKey: process.env.GRAVIXLAYER_API_KEY,
  baseURL: 'https://api.gravixlayer.com/v1/inference',
});

async function quickTest() {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: 'Say "Working!"' }],
      model: 'meta-llama/llama-3.1-8b-instruct',
      max_tokens: 5,
    });

    console.log('✅ Gravix Layer API: Working');
    console.log('📝 Response:', completion.choices[0].message.content);
    console.log('\n🌐 Server should be ready at http://localhost:3000');
    console.log('💬 Try the chat interface in your browser!');
  } catch (error) {
    console.error('❌ API Error:', error.message);
  }
}

quickTest();
