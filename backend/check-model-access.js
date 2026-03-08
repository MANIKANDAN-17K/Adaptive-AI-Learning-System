/**
 * Check which models you have access to in AWS Bedrock
 */

require('dotenv').config();
const { BedrockClient, ListFoundationModelsCommand } = require('@aws-sdk/client-bedrock');

async function checkModelAccess() {
  console.log('🔍 Checking your AWS Bedrock model access...\n');
  
  try {
    const client = new BedrockClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    const command = new ListFoundationModelsCommand({});
    const response = await client.send(command);
    
    console.log('📋 Models available in your account:\n');
    
    if (!response.modelSummaries || response.modelSummaries.length === 0) {
      console.log('❌ No models found!');
      console.log('\n💡 You need to enable model access in AWS Bedrock console:');
      console.log('   1. Go to: https://console.aws.amazon.com/bedrock/');
      console.log('   2. Click "Model access" in the left sidebar');
      console.log('   3. Click "Manage model access"');
      console.log('   4. Enable access for models you want to use');
      console.log('   5. Wait for approval (usually instant for most models)');
      return;
    }
    
    // Group by provider
    const byProvider = {};
    response.modelSummaries.forEach(model => {
      const provider = model.providerName || 'Unknown';
      if (!byProvider[provider]) byProvider[provider] = [];
      byProvider[provider].push(model);
    });
    
    Object.keys(byProvider).sort().forEach(provider => {
      console.log(`\n${provider}:`);
      byProvider[provider].forEach(model => {
        console.log(`  ✓ ${model.modelId}`);
        console.log(`    Name: ${model.modelName}`);
      });
    });
    
    console.log('\n\n💡 To use a model, update your .env file:');
    console.log('   BEDROCK_MODEL_ID=<model_id_from_above>');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.name === 'AccessDeniedException') {
      console.error('\n💡 Your AWS credentials don\'t have permission to list models.');
      console.error('   Make sure your IAM user has the "bedrock:ListFoundationModels" permission.');
    }
  }
}

checkModelAccess();
