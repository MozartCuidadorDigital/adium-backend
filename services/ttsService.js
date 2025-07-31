import elevenLabsConfig from '../config/elevenlabs.js';

class TTSService {
  constructor() {
    this.voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
    this.modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_monolingual_v1';
    this.voiceSettings = {
      stability: 0.5,
      similarity_boost: 0.5,
      style: 0.0,
      use_speaker_boost: true
    };
  }

  /**
   * Preprocess text for faster TTS generation
   * @param {string} text - Raw text
   * @returns {string} - Processed text
   */
  preprocessText(text) {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }
    
    // Remove extra whitespace and normalize
    let processed = text.trim().replace(/\s+/g, ' ');
    
    // Limit text length for TTS (ElevenLabs has limits)
    const maxLength = 1000; // Reduced from 500 to be safer
    if (processed.length > maxLength) {
      // Try to cut at a sentence boundary
      const sentences = processed.split(/[.!?]+/);
      let truncated = '';
      
      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (!trimmedSentence) continue;
        
        if ((truncated + trimmedSentence + '.').length <= maxLength) {
          truncated += (truncated ? ' ' : '') + trimmedSentence + '.';
        } else {
          break;
        }
      }
      
      if (truncated) {
        processed = truncated;
      } else {
        // If no sentence fits, just truncate
        processed = processed.substring(0, maxLength - 3) + '...';
      }
    }
    
    return processed;
  }

  /**
   * Generate speech from text with optimized settings for faster response
   * @param {string} text - Text to convert to speech
   * @param {Object} options - TTS options
   * @returns {Promise<Buffer>} - Audio buffer
   */
  async generateSpeech(text, options = {}) {
    try {
      console.log('Generating speech for:', text);
      
      // Preprocess text for faster processing
      const processedText = this.preprocessText(text);
      
      // Use optimized settings for faster response
      const ttsOptions = {
        voice_id: options.voice_id || this.voiceId,
        model_id: options.model_id || this.modelId,
        voice_settings: {
          stability: 0.5,        // Reduced for faster generation
          similarity_boost: 0.75, // Balanced for speed/quality
          style: 0.0,            // Disabled for speed
          use_speaker_boost: false // Disabled for speed
        },
        ...options
      };

      console.log('Generating speech for text:', processedText);
      
      // Add timeout for TTS generation
      const timeout = 30000; // 30 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const audioBuffer = await elevenLabsConfig.textToSpeech(processedText, ttsOptions);
        clearTimeout(timeoutId);
        
        console.log(`Generated audio buffer of size: ${audioBuffer.length} bytes`);
        return audioBuffer;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('TTS generation timed out');
        }
        throw error;
      }

    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  }

  /**
   * Stream speech generation (for real-time applications)
   * @param {string} text - Text to convert to speech
   * @param {Object} options - Additional options
   * @returns {Promise<ReadableStream>} - Audio stream
   */
  async streamSpeech(text, options = {}) {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }

      const {
        voiceId = this.voiceId,
        modelId = this.modelId,
        voiceSettings = this.voiceSettings
      } = options;

      console.log(`Streaming speech for text: "${text.substring(0, 50)}..."`);

      const audioStream = await elevenLabsConfig.streamTextToSpeech(text, {
        voiceId,
        modelId,
        voiceSettings
      });

      return audioStream;

    } catch (error) {
      console.error('Error streaming speech:', error);
      throw new Error(`Failed to stream speech: ${error.message}`);
    }
  }

  /**
   * Get available voices
   * @returns {Promise<Array>} - List of available voices
   */
  async getAvailableVoices() {
    try {
      const voices = await elevenLabsConfig.getVoices();
      return voices.map(voice => ({
        id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.labels?.description || '',
        language: voice.labels?.language || 'en'
      }));
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }

  /**
   * Get voice details
   * @param {string} voiceId - Voice ID
   * @returns {Promise<Object>} - Voice details
   */
  async getVoiceDetails(voiceId) {
    try {
      const voice = await elevenLabsConfig.getVoice(voiceId);
      return {
        id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.labels?.description || '',
        language: voice.labels?.language || 'en',
        settings: voice.settings
      };
    } catch (error) {
      console.error('Error fetching voice details:', error);
      throw new Error('Failed to fetch voice details');
    }
  }

  /**
   * Set voice ID
   * @param {string} voiceId - New voice ID
   */
  setVoiceId(voiceId) {
    this.voiceId = voiceId;
  }

  /**
   * Set model ID
   * @param {string} modelId - New model ID
   */
  setModelId(modelId) {
    this.modelId = modelId;
  }

  /**
   * Set voice settings
   * @param {Object} settings - Voice settings
   */
  setVoiceSettings(settings) {
    this.voiceSettings = { ...this.voiceSettings, ...settings };
  }

  /**
   * Get current voice settings
   * @returns {Object} - Current voice settings
   */
  getVoiceSettings() {
    return { ...this.voiceSettings };
  }

  /**
   * Validate voice ID
   * @param {string} voiceId - Voice ID to validate
   * @returns {Promise<boolean>} - Whether voice ID is valid
   */
  async validateVoiceId(voiceId) {
    try {
      await this.getVoiceDetails(voiceId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Split long text into chunks for better TTS processing
   * @param {string} text - Long text to split
   * @param {number} maxLength - Maximum length per chunk
   * @returns {Array<string>} - Array of text chunks
   */
  splitTextIntoChunks(text, maxLength = 500) {
    if (!text || text.length <= maxLength) {
      return [text];
    }

    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim());
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      if (currentChunk.length + trimmedSentence.length + 1 <= maxLength) {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk + '.');
        }
        currentChunk = trimmedSentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk + '.');
    }

    return chunks;
  }

  /**
   * Generate speech for long text by splitting into chunks
   * @param {string} text - Long text to convert
   * @param {Object} options - Additional options
   * @returns {Promise<Buffer>} - Combined audio buffer
   */
  async generateSpeechForLongText(text, options = {}) {
    try {
      const chunks = this.splitTextIntoChunks(text, options.maxChunkLength || 500);
      const audioBuffers = [];

      for (const chunk of chunks) {
        const processedChunk = this.preprocessText(chunk);
        if (processedChunk) {
          const audioBuffer = await this.generateSpeech(processedChunk, options);
          audioBuffers.push(audioBuffer);
        }
      }

      // Combine audio buffers (simple concatenation for now)
      // In a production environment, you might want to add silence between chunks
      const totalLength = audioBuffers.reduce((total, buffer) => total + buffer.length, 0);
      const combinedBuffer = Buffer.concat(audioBuffers);

      console.log(`Generated speech for ${chunks.length} chunks, total size: ${combinedBuffer.length} bytes`);
      return combinedBuffer;

    } catch (error) {
      console.error('Error generating speech for long text:', error);
      throw new Error(`Failed to generate speech for long text: ${error.message}`);
    }
  }

  /**
   * Generate speech and return a URL for the totem system
   * @param {string} text - Text to convert to speech
   * @param {Object} options - TTS options
   * @returns {Promise<Object>} - Object with success status and audio URL
   */
  async generateSpeechUrl(text, options = {}) {
    try {
      console.log('🎵 TTS Service - Generating speech URL for:', text.substring(0, 50) + '...');
      
      // Generate the audio buffer
      const audioBuffer = await this.generateSpeech(text, options);
      
      // Convert buffer to base64 data URL
      const base64Audio = audioBuffer.toString('base64');
      const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
      
      console.log('✅ TTS Service - Audio generated successfully');
      
      return {
        success: true,
        audioUrl: audioUrl,
        audioBuffer: audioBuffer,
        message: 'Audio generated successfully'
      };

    } catch (error) {
      console.error('❌ TTS Service Error:', error);
      return {
        success: false,
        error: error.message,
        audioUrl: null
      };
    }
  }
}

export default TTSService; 