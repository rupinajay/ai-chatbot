// Quick status check
const { config } = require('dotenv');
config({ path: '.env.local' });

async function checkStatus() {
  console.log('🔍 Checking Gravix Layer Chat Status...\n');

  try {
    // Check main page
    const mainPage = await fetch('http://localhost:3000/');
    console.log(
      `📄 Main page: ${mainPage.status === 200 ? '✅ Working' : '❌ Failed'} (${mainPage.status})`,
    );

    // Check auth session
    const authSession = await fetch('http://localhost:3000/api/auth/session');
    console.log(
      `🔐 Auth session: ${authSession.status === 200 ? '✅ Working' : '❌ Failed'} (${authSession.status})`,
    );

    // Check Gravix Layer API directly
    const OpenAI = require('openai').default;
    const openai = new OpenAI({
      apiKey: process.env.GRAVIXLAYER_API_KEY,
      baseURL: 'https://api.gravixlayer.com/v1/inference',
    });

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: 'Say "API working"' }],
      model: 'meta-llama/llama-3.1-8b-instruct',
      max_tokens: 10,
    });

    console.log(`🤖 Gravix Layer API: ✅ Working`);
    console.log(`📝 Response: "${completion.choices[0].message.content}"`);

    console.log('\n🎉 Status: Ready for demo!');
    console.log('🌐 Open http://localhost:3000 in your browser');
    console.log('💬 Try asking: "Write a simple Python function"');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkStatus();
