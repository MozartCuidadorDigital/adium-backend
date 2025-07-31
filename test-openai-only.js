import openAIConfig from './config/openai.js';

async function testOpenAI() {
  console.log('🧪 Testing OpenAI only...\n');

  try {
    console.log('🔍 Testing OpenAI response generation...');
    console.log('📝 Sending message: "Hola, ¿cómo estás?"');
    
    const response = await openAIConfig.generateResponse('Hola, ¿cómo estás?');
    
    console.log('✅ OpenAI response received:', response);
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ OpenAI test failed:', error);
    console.error('❌ Error stack:', error.stack);
  }
}

// Run test
testOpenAI().then(() => {
  console.log('Test finished');
  process.exit(0);
}).catch((error) => {
  console.error('Test error:', error);
  process.exit(1);
}); 