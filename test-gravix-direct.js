// Direct test of Gravix API to see what it returns
console.log('🧪 Testing Gravix API directly...');

const testGravixAPI = async () => {
  try {
    const response = await fetch(
      'https://api.gravixlayer.com/v1/inference/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GRAVIXLAYER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct',
          messages: [
            {
              role: 'user',
              content: 'Hello, please respond with a simple greeting.',
            },
          ],
          max_tokens: 100,
          temperature: 0.7,
          stream: false,
        }),
      },
    );

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

    const data = await response.json();
    console.log('✅ API Response:', JSON.stringify(data, null, 2));

    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('📝 Generated text:', data.choices[0].message.content);
    } else {
      console.log('❌ No text content in response');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testGravixAPI();
