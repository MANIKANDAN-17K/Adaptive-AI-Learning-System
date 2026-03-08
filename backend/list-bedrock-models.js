/**
 * List available Bedrock models
 */

require('dotenv').config();
const { BedrockClient, ListFoundationModelsCommand } = require('@aws-sdk/client-bedrock');

async function listModels() {
  console.log('🔍 Listing available Bedrock models...\n');
  
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
    
    console.log('Available models:\n');
    
    // Filter for Llama models
    const llamaModels = response.modelSummaries?.filter(m => 
      m.modelId?.toLowerCase().includes('llama')
    ) || [];
    
    if (llamaModels.length > 0) {
      console.log('🦙 Llama Models:');
      llamaModels.forEach(model => {
        console.log(`  - ${model.modelId}`);
        console.log(`    Name: ${model.modelName}`);
        console.log(`    Provider: ${model.providerName}`);
        console.log('');
      });
    }
    
    // Show other popular models
    const otherModels = response.modelSummaries?.filter(m => 
      !m.modelId?.toLowerCase().includes('llama') &&
      (m.modelId?.includes('claude') || m.modelId?.includes('titan'))
    ) || [];
    
    if (otherModels.length > 0) {
      console.log('\n📚 Other Available Models:');
      otherModels.slice(0, 5).forEach(model => {
        console.log(`  - ${model.modelId}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listModels();
