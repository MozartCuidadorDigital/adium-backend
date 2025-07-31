import AudioPipeline from './services/audioPipeline.js';

class FullFlowTester {
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

    this.audioPipeline.on('audioLevel', (level) => {
      console.log('🔊 Audio level:', level);
    });
  }

  async testFullFlow() {
    console.log('🧪 Testing full flow...\n');

    try {
      // Step 1: Start call
      console.log('Step 1: Starting call...');
      await this.audioPipeline.startCall();
      await this.sleep(3000);

      // Step 2: Simulate audio chunks (silence)
      console.log('\nStep 2: Simulating audio chunks...');
      const silenceChunk = Buffer.alloc(3200, 0x00);
      for (let i = 0; i < 10; i++) {
        await this.audioPipeline.processAudioChunk(silenceChunk);
        await this.sleep(100);
      }

      // Step 3: Simulate the exact transcription from logs
      console.log('\nStep 3: Simulating transcription...');
      this.simulateTranscription('O sea, que te vería ahorita que sirves bien.', true);
      
      console.log('⏳ Esperando respuesta de OpenAI...');
      await this.sleep(5000);
      console.log('⏳ 5 segundos transcurridos...');
      await this.sleep(5000);
      console.log('⏳ 10 segundos transcurridos...');
      await this.sleep(5000);
      console.log('⏳ 15 segundos transcurridos...');

      // Step 4: Check status
      console.log('\nStep 4: Checking status...');
      const status = this.audioPipeline.getStatus();
      console.log('Status:', status);

      // Step 5: Stop call
      console.log('\nStep 5: Stopping call...');
      this.audioPipeline.stopCall();

      console.log('\n✅ Full flow test completed');

    } catch (error) {
      console.error('❌ Full flow test failed:', error);
    }
  }

  simulateTranscription(text, isFinal) {
    console.log(`📝 Simulating transcription: "${text}" (final: ${isFinal})`);
    
    const transcription = {
      text: text,
      isFinal: isFinal,
      confidence: 0.95
    };
    
    this.audioPipeline.handleDeepgramTranscription(transcription);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run test
const tester = new FullFlowTester();
tester.testFullFlow().then(() => {
  console.log('Test finished');
  process.exit(0);
}).catch((error) => {
  console.error('Test error:', error);
  process.exit(1);
}); 