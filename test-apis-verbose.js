import openAIConfig from './config/openai.js';
import elevenLabsConfig from './config/elevenlabs.js';
import deepgramConfig from './config/deepgram.js';

class APIVerificationTester {
  constructor() {
    this.testResults = {
      openai: false,
      elevenlabs: false,
      deepgram: false
    };
  }

  async testAllAPIs() {
    console.log('🧪 Testing all APIs...\n');

    try {
      // Test OpenAI
      console.log('🔍 Testing OpenAI...');
      await this.testOpenAI();
      await this.sleep(1000);

      // Test ElevenLabs
      console.log('\n🔍 Testing ElevenLabs...');
      await this.testElevenLabs();
      await this.sleep(1000);

      // Test Deepgram
      console.log('\n🔍 Testing Deepgram...');
      await this.testDeepgram();
      await this.sleep(1000);

      // Summary
      console.log('\n📊 API Test Results:');
      console.log('OpenAI:', this.testResults.openai ? '✅' : '❌');
      console.log('ElevenLabs:', this.testResults.elevenlabs ? '✅' : '❌');
      console.log('Deepgram:', this.testResults.deepgram ? '✅' : '❌');

    } catch (error) {
      console.error('❌ API test failed:', error);
    }
  }

  async testOpenAI() {
    try {
      console.log('  - Validating API key...');
      const isValid = await openAIConfig.validateApiKey();
      console.log('  - API key valid:', isValid);
      
      if (isValid) {
        console.log('  - Testing response generation...');
        const response = await openAIConfig.generateResponse('Hola, ¿cómo estás?');
        console.log('  - Response received:', response);
        this.testResults.openai = true;
      } else {
        console.log('  - OpenAI API key is invalid');
        this.testResults.openai = false;
      }
    } catch (error) {
      console.error('  - OpenAI test failed:', error.message);
      this.testResults.openai = false;
    }
  }

  async testElevenLabs() {
    try {
      console.log('  - Validating API key...');
      const isValid = await elevenLabsConfig.validateApiKey();
      console.log('  - API key valid:', isValid);
      
      if (isValid) {
        console.log('  - Testing speech generation...');
        const audioBuffer = await elevenLabsConfig.textToSpeech('Hola, esto es una prueba.');
        console.log('  - Audio generated:', audioBuffer.length, 'bytes');
        this.testResults.elevenlabs = true;
      } else {
        console.log('  - ElevenLabs API key is invalid');
        this.testResults.elevenlabs = false;
      }
    } catch (error) {
      console.error('  - ElevenLabs test failed:', error.message);
      this.testResults.elevenlabs = false;
    }
  }

  async testDeepgram() {
    try {
      console.log('  - Validating API key...');
      const isValid = await deepgramConfig.validateApiKey();
      console.log('  - API key valid:', isValid);
      this.testResults.deepgram = isValid;
    } catch (error) {
      console.error('  - Deepgram test failed:', error.message);
      this.testResults.deepgram = false;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run test
const tester = new APIVerificationTester();
tester.testAllAPIs().then(() => {
  console.log('\n✅ API verification completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ API verification failed:', error);
  process.exit(1);
}); 