import AudioPipeline from './services/audioPipeline.js';

class SilenceDetectionTester {
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

  async testSilenceDetection() {
    console.log('🧪 Testing silence detection...\n');

    try {
      // Step 1: Start call
      console.log('Step 1: Starting call...');
      await this.audioPipeline.startCall();
      await this.sleep(2000);

      // Step 2: Simulate transcription
      console.log('\nStep 2: Simulating transcription...');
      this.simulateTranscription('Hola, Mozart.', true);
      await this.sleep(1000);

      // Step 3: Send silence to trigger processing
      console.log('\nStep 3: Sending silence...');
      const silenceChunk = Buffer.alloc(3200, 0x00); // Silencio puro
      
      for (let i = 0; i < 20; i++) {
        await this.audioPipeline.processAudioChunk(silenceChunk);
        await this.sleep(50);
      }

      // Step 4: Wait for processing
      console.log('\nStep 4: Waiting for processing...');
      await this.sleep(5000);

      // Step 5: Check status
      console.log('\nStep 5: Checking status...');
      const status = this.audioPipeline.getStatus();
      console.log('Status:', status);

      // Step 6: Stop call
      console.log('\nStep 6: Stopping call...');
      this.audioPipeline.stopCall();

      console.log('\n✅ Silence detection test completed');

    } catch (error) {
      console.error('❌ Silence detection test failed:', error);
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
const tester = new SilenceDetectionTester();
tester.testSilenceDetection().then(() => {
  console.log('Test finished');
  process.exit(0);
}).catch((error) => {
  console.error('Test error:', error);
  process.exit(1);
}); 