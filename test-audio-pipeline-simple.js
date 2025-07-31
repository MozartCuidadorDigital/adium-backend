import AudioPipeline from './services/audioPipeline.js';

async function testAudioPipelineSimple() {
  console.log('🧪 Testing AudioPipeline simple...\n');

  try {
    // Crear AudioPipeline
    console.log('🔍 Creating AudioPipeline...');
    const audioPipeline = new AudioPipeline();
    
    // Iniciar llamada
    console.log('🚀 Starting call...');
    await audioPipeline.startCall();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simular transcripción
    console.log('📝 Simulating transcription...');
    const transcription = {
      text: 'O sea, que te vería ahorita que sirves bien.',
      isFinal: true,
      confidence: 0.95
    };
    
    console.log('🎯 Processing transcription...');
    audioPipeline.handleDeepgramTranscription(transcription);
    
    // Esperar respuesta
    console.log('⏳ Waiting for response...');
    await new Promise(resolve => setTimeout(resolve, 20000)); // Aumentado a 20 segundos
    
    // Detener llamada
    console.log('🛑 Stopping call...');
    audioPipeline.stopCall();
    
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('❌ Error stack:', error.stack);
  }
}

// Run test
testAudioPipelineSimple().then(() => {
  console.log('Test finished');
  process.exit(0);
}).catch((error) => {
  console.error('Test error:', error);
  process.exit(1);
}); 