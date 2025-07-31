import openAIConfig from './config/openai.js';

async function testOpenAIWithTimeout() {
  console.log('🧪 Testing OpenAI with timeout...\n');

  try {
    console.log('🔍 Testing OpenAI response generation...');
    console.log('📝 Sending message: "Hola, ¿cómo estás?"');
    
    // Crear una promesa con timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI request timed out after 10 seconds')), 10000);
    });
    
    const openAIPromise = openAIConfig.generateResponse('Hola, ¿cómo estás?');
    
    // Usar Promise.race para detectar timeout
    const response = await Promise.race([openAIPromise, timeoutPromise]);
    
    console.log('✅ OpenAI response received:', response);
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ OpenAI test failed:', error.message);
    console.error('❌ Error stack:', error.stack);
  }
}

// Run test
testOpenAIWithTimeout().then(() => {
  console.log('Test finished');
  process.exit(0);
}).catch((error) => {
  console.error('Test error:', error);
  process.exit(1);
}); 