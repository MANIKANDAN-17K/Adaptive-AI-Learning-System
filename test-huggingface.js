#!/usr/bin/env node

/**
 * Test Hugging Face API Connection
 */

console.log('🤗 Testing Hugging Face API Connection...\n');

const model = 'mistralai/Mistral-7B-Instruct-v0.2';
const prompt = '<s>[INST] Say "Hello, Hugging Face is working!" [/INST]';

async function testHuggingFace() {
  try {
    console.log('Model:', model);
    console.log('Sending test request...\n');
    
    const startTime = Date.now();
    
    const response = await fetch(`https://router.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 50,
          temperature: 0.7,
          return_full_text: false
        }
      })
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('Response Status:', response.status);
    console.log('Response Time:', duration + 's\n');
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Error Response:', error);
      
      if (response.status === 503 && error.includes('loading')) {
        console.log('\n⏳ MODEL IS LOADING');
        console.log('This is normal for the first request!');
        console.log('The model needs to "wake up" (takes 10-15 seconds)');
        console.log('\nWaiting 15 seconds and trying again...\n');
        
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        // Retry
        const response2 = await fetch(`https://router.huggingface.co/models/${model}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 50,
              temperature: 0.7,
              return_full_text: false
            }
          })
        });
        
        if (response2.ok) {
          const data2 = await response2.json();
          console.log('✅ SUCCESS (after model loaded)!');
          console.log('Response:', data2[0]?.generated_text || data2);
          console.log('\n🎉 Hugging Face API is working!');
          console.log('Note: First request is always slow. Subsequent requests are fast.');
        } else {
          const error2 = await response2.text();
          console.error('Still failed:', error2);
        }
      } else if (response.status === 429) {
        console.error('\n❌ RATE LIMIT');
        console.error('Too many requests. Solutions:');
        console.error('1. Wait a few minutes');
        console.error('2. Get free HF account: https://huggingface.co/join');
        console.error('3. Add API key to backend/.env');
      }
      return;
    }

    const data = await response.json();
    console.log('✅ SUCCESS!');
    console.log('Response:', data[0]?.generated_text || data);
    console.log('\n🎉 Hugging Face API is working perfectly!');
    console.log(`Response time: ${duration}s`);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nPossible causes:');
    console.error('1. No internet connection');
    console.error('2. Firewall blocking Hugging Face');
    console.error('3. DNS issues');
  }
}

testHuggingFace();
