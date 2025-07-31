import AudioPipeline from './services/audioPipeline.js';

class DebugProcessingTester {
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

  async testDebugProcessing() {
    console.log('🧪 Testing debug processing...\n');

    try {
      // Step 1: Start call
      console.log('Step 1: Starting call...');
      await this.audioPipeline.startCall();
      await this.sleep(2000);

      // Step 2: Simulate the exact transcription from logs
      console.log('\nStep 2: Simulating transcription...');
      this.simulateTranscription('O sea que en teoría ya puede responder normal mis palabras.', true);
      await this.sleep(5000);

      // Step 3: Check status
      console.log('\nStep 3: Checking status...');
      const status = this.audioPipeline.getStatus();
      console.log('Status:', status);

      // Step 4: Stop call
      console.log('\nStep 4: Stopping call...');
      this.audioPipeline.stopCall();

      console.log('\n✅ Debug processing test completed');

    } catch (error) {
      console.error('❌ Debug processing test failed:', error);
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
const tester = new DebugProcessingTester();
tester.testDebugProcessing().then(() => {
  console.log('Test finished');
  process.exit(0);
}).catch((error) => {
  console.error('Test error:', error);
  process.exit(1);
}); 