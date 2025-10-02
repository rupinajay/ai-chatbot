// Simple chat API test
const { config } = require('dotenv');
config({ path: '.env.local' });

async function testChat() {
  console.log('🧪 Testing simplified chat API...');

  try {
    // Test the chat API directly
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'test-chat-' + Date.now(),
        message: {
          id: 'test-msg-' + Date.now(),
          role: 'user',
          parts: [{ type: 'text', text: 'Hello! Say "Working!"' }],
        },
        selectedChatModel: 'chat-model',
        selectedVisibilityType: 'private',
      }),
    });

    console.log('📡 Chat API Status:', response.status);

    if (response.ok) {
      console.log('✅ Chat API is responding!');
      console.log('🌐 Try the web interface at http://localhost:3000');
    } else {
      console.log('❌ Chat API failed');
      const text = await response.text();
      console.log('Response:', text);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testChat();
