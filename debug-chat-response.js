// Debug script to test the chat API response format
const testChatAPI = async () => {
  console.log('🔍 Testing chat API response format...');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'test-chat-' + Date.now(),
        message: {
          id: 'test-msg-' + Date.now(),
          role: 'user',
          parts: [{ type: 'text', text: 'Hello, test message' }],
        },
        selectedChatModel: 'chat-model-fast',
        selectedVisibilityType: 'private',
      }),
    });

    console.log('📡 Response status:', response.status);
    console.log(
      '📡 Response headers:',
      Object.fromEntries(response.headers.entries()),
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return;
    }

    // Check if it's a stream
    const contentType = response.headers.get('content-type');
    console.log('📡 Content-Type:', contentType);

    if (contentType?.includes('text/event-stream')) {
      console.log('✅ Detected SSE stream');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let eventCount = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          console.log(`📦 SSE Chunk ${++eventCount}:`, chunk);

          // Parse SSE events
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                console.log('✅ Stream completed with [DONE]');
              } else {
                try {
                  const parsed = JSON.parse(data);
                  console.log('📋 Parsed event:', parsed);
                } catch (e) {
                  console.log('📋 Raw data:', data);
                }
              }
            }
          }
        }
      }
    } else {
      const text = await response.text();
      console.log('📄 Response body:', text);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testChatAPI();
