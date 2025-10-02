// Debug script to trace the complete message flow
console.log('🔍 Debugging message flow...');

// Test 1: Check if the API returns proper data
async function testAPIResponse() {
  console.log('\n=== TEST 1: API Response ===');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'debug-' + Date.now(),
        message: {
          id: 'msg-' + Date.now(),
          role: 'user',
          parts: [{ type: 'text', text: 'Debug test message' }],
        },
        selectedChatModel: 'chat-model',
        selectedVisibilityType: 'private',
      }),
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const error = await response.text();
      console.error('API Error:', error);
      return null;
    }

    // Collect all events
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const events = [];
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('✅ Stream completed');
            break;
          } else if (data.trim()) {
            try {
              const event = JSON.parse(data);
              events.push(event);

              if (event.type === 'text-delta') {
                fullText += event.delta || '';
              }
            } catch (e) {
              console.log('Parse error:', data);
            }
          }
        }
      }
    }

    console.log('Events received:', events.length);
    console.log('Full text assembled:', JSON.stringify(fullText));
    console.log('Sample events:', events.slice(0, 3));

    return { events, fullText };
  } catch (error) {
    console.error('Test failed:', error);
    return null;
  }
}

// Test 2: Check message structure
function testMessageStructure() {
  console.log('\n=== TEST 2: Message Structure ===');

  const sampleMessage = {
    id: 'test-123',
    role: 'assistant',
    parts: [{ type: 'text', text: 'Hello world' }],
  };

  console.log('Sample message:', JSON.stringify(sampleMessage, null, 2));

  // Test sanitizeText function
  const testText = 'Hello <has_function_call> world';
  const sanitized = testText.replace('<has_function_call>', '');
  console.log('Sanitized text:', JSON.stringify(sanitized));

  return sampleMessage;
}

// Test 3: Check if useChat format is correct
function testUseChatFormat() {
  console.log('\n=== TEST 3: useChat Format ===');

  // This is what useChat expects based on AI SDK docs
  const expectedEvents = [
    { type: 'text-delta', id: 'msg-1', delta: 'Hello' },
    { type: 'text-delta', id: 'msg-1', delta: ' world' },
    { type: 'finish', finishReason: 'stop' },
  ];

  console.log(
    'Expected event format:',
    JSON.stringify(expectedEvents, null, 2),
  );

  return expectedEvents;
}

// Run all tests
async function runAllTests() {
  testMessageStructure();
  testUseChatFormat();

  const apiResult = await testAPIResponse();

  if (apiResult) {
    console.log('\n=== ANALYSIS ===');
    console.log('✅ API responded successfully');
    console.log('📊 Events count:', apiResult.events.length);
    console.log('📝 Text length:', apiResult.fullText.length);

    if (apiResult.fullText.length === 0) {
      console.log('❌ ISSUE: No text content received');
    } else {
      console.log('✅ Text content received');
    }

    const hasTextDeltas = apiResult.events.some((e) => e.type === 'text-delta');
    const hasFinish = apiResult.events.some((e) => e.type === 'finish');

    console.log('📋 Has text-delta events:', hasTextDeltas);
    console.log('📋 Has finish event:', hasFinish);

    if (!hasTextDeltas) {
      console.log('❌ ISSUE: No text-delta events found');
    }
  } else {
    console.log('\n=== ANALYSIS ===');
    console.log('❌ API request failed');
  }
}

// Execute
runAllTests().catch(console.error);
