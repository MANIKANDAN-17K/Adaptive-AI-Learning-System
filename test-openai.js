#!/usr/bin/env node

/**
 * Test OpenAI API Connection
 */

require('dotenv').config({ path: './backend/.env' });

const apiKey = process.env.OPENAI_API_KEY;

console.log('Testing OpenAI API Connection...\n');
console.log('API Key:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NOT FOUND');

async function testOpenAI() {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: 'Say "Hello, API is working!"' }
        ],
        max_tokens: 20
      })
    });

    console.log('Response Status:', response.status);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Error Response:', error);
      
      if (response.status === 401) {
        console.error('\n❌ AUTHENTICATION ERROR');
        console.error('Your OpenAI API key is invalid or expired.');
        console.error('Please check your API key at: https://platform.openai.com/api-keys');
      } else if (response.status === 429) {
        console.error('\n❌ RATE LIMIT ERROR');
        console.error('Too many requests or insufficient credits.');
        console.error('Check your usage at: https://platform.openai.com/usage');
      } else if (response.status === 404) {
        console.error('\n❌ MODEL NOT FOUND');
        console.error('The model gpt-4o-mini is not available for your account.');
        console.error('Try using gpt-3.5-turbo instead.');
      }
      return;
    }

    const data = await response.json();
    console.log('\n✅ SUCCESS!');
    console.log('Response:', data.choices[0].message.content);
    console.log('\nYour OpenAI API is working correctly!');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

testOpenAI();
