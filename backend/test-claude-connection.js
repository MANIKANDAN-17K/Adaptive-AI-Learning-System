/**
 * Test script to verify AWS Bedrock connection with Claude
 */

require('dotenv').config();
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

async function testClaudeConnection() {
  console.log('🔍 Testing AWS Bedrock Connection with Claude...\n');
  
  console.log('Environment Variables:');
  console.log('  AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✓ Set' : '✗ Missing');
  console.log('  AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Missing');
  console.log('  AWS_REGION:', process.env.AWS_REGION || 'us-east-1');
  console.log('  BEDROCK_MODEL_ID:', process.env.BEDROCK_MODEL_ID);
  console.log('');
  
  try {
    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    console.log('✓ Bedrock client initialized\n');
    
    const modelId = process.env.BEDROCK_MODEL_ID;
    console.log(`🚀 Testing model: ${modelId}\n`);
    
    const input = {
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 100,
        temperature: 0.7,
        system: 'You are a helpful AI assistant.',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, I am working!" in one sentence.'
          }
        ]
      })
    };
    
    console.log('📤 Sending test request to Bedrock...');
    const command = new InvokeModelCommand(input);
    const response = await client.send(command);
    
    console.log('✓ Response received\n');
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('Response Body:', JSON.stringify(responseBody, null, 2));
    
    if (responseBody.content && responseBody.content[0]?.text) {
      console.log('\n✅ SUCCESS! Bedrock with Claude is working correctly!');
      console.log('AI Response:', responseBody.content[0].text);
    } else {
      console.log('\n⚠️  Response received but unexpected format');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testClaudeConnection();
