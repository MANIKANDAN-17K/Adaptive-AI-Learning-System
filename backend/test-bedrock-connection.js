/**
 * Test script to verify AWS Bedrock connection
 */

require('dotenv').config();
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

async function testBedrockConnection() {
  console.log('🔍 Testing AWS Bedrock Connection...\n');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('  AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✓ Set' : '✗ Missing');
  console.log('  AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Missing');
  console.log('  AWS_REGION:', process.env.AWS_REGION || 'us-east-1');
  console.log('  BEDROCK_MODEL_ID:', process.env.BEDROCK_MODEL_ID || 'meta.llama4-scout-17b-instruct-v1:0');
  console.log('');
  
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ AWS credentials are missing!');
    process.exit(1);
  }
  
  try {
    // Initialize client
    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    console.log('✓ Bedrock client initialized\n');
    
    // Test model invocation
    const modelId = process.env.BEDROCK_MODEL_ID || 'meta.llama4-scout-17b-instruct-v1:0';
    console.log(`🚀 Testing model: ${modelId}\n`);
    
    const prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are a helpful AI assistant.<|eot_id|><|start_header_id|>user<|end_header_id|>

Say "Hello, I am working!" in one sentence.<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`;
    
    const input = {
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        prompt: prompt,
        max_gen_len: 100,
        temperature: 0.7,
        top_p: 0.9
      })
    };
    
    console.log('📤 Sending test request to Bedrock...');
    const command = new InvokeModelCommand(input);
    const response = await client.send(command);
    
    console.log('✓ Response received\n');
    
    // Parse response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('Response Body:', JSON.stringify(responseBody, null, 2));
    
    if (responseBody.generation) {
      console.log('\n✅ SUCCESS! Bedrock is working correctly!');
      console.log('AI Response:', responseBody.generation);
    } else {
      console.log('\n⚠️  Response received but no generation field found');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    
    if (error.name === 'ResourceNotFoundException') {
      console.error('\n💡 The model ID might be incorrect or not available in your region.');
      console.error('   Try checking available models in AWS Bedrock console.');
    } else if (error.name === 'AccessDeniedException') {
      console.error('\n💡 Your AWS credentials don\'t have permission to access Bedrock.');
      console.error('   Make sure your IAM user/role has the "bedrock:InvokeModel" permission.');
    } else if (error.message?.includes('credentials')) {
      console.error('\n💡 There\'s an issue with your AWS credentials.');
      console.error('   Double-check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
    }
    
    process.exit(1);
  }
}

testBedrockConnection();
