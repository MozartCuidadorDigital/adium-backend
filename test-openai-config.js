import openAIConfig from './config/openai.js';

async function testOpenAIConfig() {
  console.log('🧪 Testing OpenAIConfig instance...\n');

  try {
    console.log('🔍 Testing OpenAIConfig.generateResponse...');
    console.log('📝 Sending message: "Hola, ¿cómo estás?"');
    
    const response = await openAIConfig.generateResponse('Hola, ¿cómo estás?');
    
    console.log('✅ OpenAIConfig response received:', response);
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ OpenAIConfig test failed:', error.message);
    console.error('❌ Error stack:', error.stack);
  }
}

// Run test
testOpenAIConfig().then(() => {
  console.log('Test finished');
  process.exit(0);
}).catch((error) => {
  console.error('Test error:', error);
  process.exit(1);
}); 