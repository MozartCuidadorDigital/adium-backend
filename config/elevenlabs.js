import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class ElevenLabsConfig {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.baseURL = 'https://api.elevenlabs.io/v1';
    this.voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel
    this.modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_monolingual_v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Generate speech from text
   * @param {string} text - Text to convert to speech
   * @param {Object} options - Additional options
   * @returns {Promise<Buffer>} - Audio buffer
   */
  async textToSpeech(text, options = {}) {
    try {
      const {
        voiceId = this.voiceId,
        modelId = this.modelId,
        voiceSettings = {
          stability: 0.5,
          similarity_boost: 0.5
        }
      } = options;

      const response = await this.client.post(`/text-to-speech/${voiceId}`, {
        text: text,
        model_id: modelId,
        voice_settings: voiceSettings
      }, {
        responseType: 'arraybuffer'
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error generating speech with ElevenLabs:', error);
      throw new Error('Failed to generate speech');
    }
  }

  /**
   * Stream text to speech (for real-time applications)
   * @param {string} text - Text to convert to speech
   * @param {Object} options - Additional options
   * @returns {Promise<ReadableStream>} - Audio stream
   */
  async streamTextToSpeech(text, options = {}) {
    try {
      const {
        voiceId = this.voiceId,
        modelId = this.modelId,
        voiceSettings = {
          stability: 0.5,
          similarity_boost: 0.5
        }
      } = options;

      const response = await this.client.post(`/text-to-speech/${voiceId}/stream`, {
        text: text,
        model_id: modelId,
        voice_settings: voiceSettings
      }, {
        responseType: 'stream'
      });

      return response.data;
    } catch (error) {
      console.error('Error streaming speech with ElevenLabs:', error);
      throw new Error('Failed to stream speech');
    }
  }

  /**
   * Get available voices
   * @returns {Promise<Array>} - List of available voices
   */
  async getVoices() {
    try {
      const response = await this.client.get('/voices');
      return response.data.voices;
    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error);
      return [];
    }
  }

  /**
   * Get voice details
   * @param {string} voiceId - Voice ID
   * @returns {Promise<Object>} - Voice details
   */
  async getVoice(voiceId) {
    try {
      const response = await this.client.get(`/voices/${voiceId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching voice details:', error);
      throw new Error('Failed to fetch voice details');
    }
  }

  /**
   * Validate API key
   * @returns {Promise<boolean>} - Whether the API key is valid
   */
  async validateApiKey() {
    try {
      await this.getVoices();
      return true;
    } catch (error) {
      console.error('ElevenLabs API key validation failed:', error);
      return false;
    }
  }

  /**
   * Get default voice settings
   * @returns {Object} - Default voice settings
   */
  getDefaultVoiceSettings() {
    return {
      stability: 0.5,
      similarity_boost: 0.5,
      style: 0.0,
      use_speaker_boost: true
    };
  }
}

// Export singleton instance
const elevenLabsConfig = new ElevenLabsConfig();
export default elevenLabsConfig; 