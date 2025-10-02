// Debug what the browser is actually receiving
const { config } = require('dotenv');
config({ path: '.env.local' });

async function debugResponse() {
  console.log('🔍 Debugging what the browser receives...');

  try {
    // Simulate the exact request the frontend makes
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        id: 'debug-chat-' + Date.now(),
        message: {
          id: 'debug-msg-' + Date.now(),
          role: 'user',
          parts: [{ type: 'text', text: 'Hello debug test' }],
        },
        selectedChatModel: 'chat-model',
        selectedVisibilityType: 'private',
      }),
    });

    console.log('📡 Response Status:', response.status);
    console.log('📋 Response Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }

    if (response.body) {
      console.log('\n📝 Response Body (first 500 chars):');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          text += chunk;
          console.log('📦 Chunk received:', chunk);

          if (text.length > 500) break;
        }
      } catch (e) {
        console.log('📦 Stream ended or error:', e.message);
      }

      console.log('\n📄 Full response so far:', text);
    }
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugResponse();
