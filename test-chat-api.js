// Test the chat API endpoint
const { config } = require('dotenv');
config({ path: '.env.local' });

async function testChatAPI() {
  console.log('🧪 Testing Chat API with Gravix Layer...');

  try {
    // First, let's test if we can access the main page
    const response = await fetch('http://localhost:3000/');
    console.log('📄 Main page status:', response.status);

    if (response.status === 200) {
      console.log('✅ Main page loads successfully!');
      console.log('🌐 You can now open http://localhost:3000 in your browser');
      console.log(
        '💬 Try asking: "Write a Python function to calculate fibonacci numbers"',
      );
      console.log(
        "🤖 The response should come from Gravix Layer's Llama models",
      );
    } else {
      console.log('❌ Main page failed to load');
    }
  } catch (error) {
    console.error('❌ Error testing chat API:', error.message);
  }
}

testChatAPI();
