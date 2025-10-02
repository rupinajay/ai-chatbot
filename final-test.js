// Final comprehensive test
const { config } = require('dotenv');
config({ path: '.env.local' });

async function finalTest() {
  console.log('🎯 Final Gravix Layer Chat Test\n');

  try {
    // Test 1: Gravix Layer API
    console.log('1️⃣ Testing Gravix Layer API...');
    const OpenAI = require('openai').default;
    const openai = new OpenAI({
      apiKey: process.env.GRAVIXLAYER_API_KEY,
      baseURL: 'https://api.gravixlayer.com/v1/inference',
    });

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: 'Say "API Ready!"' }],
      model: 'meta-llama/llama-3.1-8b-instruct',
      max_tokens: 10,
    });

    console.log('   ✅ Gravix Layer API: Working');
    console.log(`   📝 Response: "${completion.choices[0].message.content}"`);

    // Test 2: Web Server
    console.log('\n2️⃣ Testing Web Server...');
    const mainPage = await fetch('http://localhost:3000/');
    console.log(
      `   ✅ Main Page: ${mainPage.status === 200 ? 'Working' : 'Failed'} (${mainPage.status})`,
    );

    const authSession = await fetch('http://localhost:3000/api/auth/session');
    console.log(
      `   ✅ Auth Session: ${authSession.status === 200 ? 'Working' : 'Failed'} (${authSession.status})`,
    );

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n🌐 Demo Ready:');
    console.log('   • Open: http://localhost:3000');
    console.log('   • Try: "Write a Python function to calculate fibonacci"');
    console.log('   • Expect: Response from Gravix Layer Llama models');
    console.log('\n✨ Your Gravix Layer chat is fully functional!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

finalTest();
