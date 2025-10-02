// Test script to verify the AI SDK response format
console.log('🧪 Testing AI SDK chat response...');

const testMessage = {
  id: 'test-' + Date.now(),
  role: 'user',
  parts: [{ type: 'text', text: 'Hello, this is a test message' }],
};

const testPayload = {
  id: 'test-chat-' + Date.now(),
  message: testMessage,
  selectedChatModel: 'chat-model',
  selectedVisibilityType: 'private',
};

fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testPayload),
})
  .then((response) => {
    console.log('📡 Response status:', response.status);
    console.log(
      '📡 Response headers:',
      Object.fromEntries(response.headers.entries()),
    );

    if (!response.ok) {
      return response.text().then((text) => {
        console.error('❌ Error response:', text);
      });
    }

    // Read the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let eventCount = 0;
    const events = [];

    function readStream() {
      return reader.read().then(({ done, value }) => {
        if (done) {
          console.log('✅ Stream completed');
          console.log('📋 All events received:', events);
          return;
        }

        const chunk = decoder.decode(value);
        console.log(`📦 Chunk ${++eventCount}:`, chunk);

        // Parse SSE events
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log('🏁 Received [DONE] marker');
            } else if (data.trim()) {
              try {
                const parsed = JSON.parse(data);
                events.push(parsed);
                console.log('📋 Event:', parsed);
              } catch (e) {
                console.log('📋 Raw data:', data);
              }
            }
          }
        }

        return readStream();
      });
    }

    return readStream();
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
  });
