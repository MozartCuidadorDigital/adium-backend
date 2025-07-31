import AudioPipeline from './services/audioPipeline.js';

class TranscriptionProcessorTester {
  constructor() {
    this.audioPipeline = new AudioPipeline();
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.audioPipeline.on('callStarted', () => {
      console.log('✅ Call started');
    });

    this.audioPipeline.on('transcription', (transcription) => {
      console.log('📝 Transcription event:', transcription);
    });

    this.audioPipeline.on('aiResponse', (response) => {
      console.log('💬 AI Response event:', response);
    });

    this.audioPipeline.on('ttsAudio', (ttsData) => {
      console.log('🔊 TTS Audio event:', ttsData.audioBuffer.length, 'bytes');
    });

    this.audioPipeline.on('processingStarted', () => {
      console.log('🤖 Processing started');
    });

    this.audioPipeline.on('processingFinished', () => {
      console.log('✅ Processing finished');
    });

    this.audioPipeline.on('error', (error) => {
      console.error('❌ Error:', error);
    });
  }

  async testTranscriptionProcessing() {
    console.log('🧪 Testing transcription processing...\n');

    try {
      // Step 1: Start call
      console.log('Step 1: Starting call...');
      await this.audioPipeline.startCall();
      await this.sleep(2000);

      // Step 2: Simulate transcription messages like Deepgram would send
      console.log('\nStep 2: Simulating transcription messages...');
      
      // Simular transcripción parcial (como Deepgram envía)
      this.simulateTranscription('Hola', false);
      await this.sleep(500);
      
      // Simular transcripción parcial actualizada
      this.simulateTranscription('Hola, ¿cómo', false);
      await this.sleep(500);
      
      // Simular transcripción final completa
      this.simulateTranscription('Hola, ¿cómo estás?', true);
      await this.sleep(2000);

      // Step 3: Simulate silence to trigger processing
      console.log('\nStep 3: Simulating silence...');
      const silenceChunk = Buffer.alloc(3200);
      
      for (let i = 0; i < 10; i++) {
        await this.audioPipeline.processAudioChunk(silenceChunk);
        await this.sleep(100);
      }

      // Step 4: Wait for processing
      console.log('\nStep 4: Waiting for processing...');
      await this.sleep(8000);

      // Step 5: Check status
      console.log('\nStep 5: Checking status...');
      const status = this.audioPipeline.getStatus();
      console.log('Status:', status);

      // Step 6: Stop call
      console.log('\nStep 6: Stopping call...');
      this.audioPipeline.stopCall();

      console.log('\n✅ Transcription processing test completed');

    } catch (error) {
      console.error('❌ Transcription processing test failed:', error);
    }
  }

  simulateTranscription(text, isFinal) {
    console.log(`📝 Simulating transcription: "${text}" (final: ${isFinal})`);
    
    // Simular el mensaje que vendría de Deepgram
    const transcription = {
      text: text,
      isFinal: isFinal,
      confidence: 0.95
    };
    
    // Llamar directamente al manejador de transcripción
    this.audioPipeline.handleDeepgramTranscription(transcription);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run test
const tester = new TranscriptionProcessorTester();
tester.testTranscriptionProcessing().then(() => {
  console.log('Test finished');
  process.exit(0);
}).catch((error) => {
  console.error('Test error:', error);
  process.exit(1);
}); 