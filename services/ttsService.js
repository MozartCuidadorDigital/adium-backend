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
   * Correct pronunciation for specific words before TTS generation
   * @param {string} text - Raw text
   * @returns {string} - Text with pronunciation corrections
   */
  correctPronunciation(text) {
    if (!text) return text;

    let correctedText = text;

    // Remove problematic bullet points and list markers first (more aggressive)
    correctedText = correctedText.replace(/^\s*[•·▪▫]\s*/gm, ''); // Remove bullet points at start of lines
    correctedText = correctedText.replace(/\s*[•·▪▫]\s*/g, ' '); // Remove bullet points anywhere
    correctedText = correctedText.replace(/^\s*[-–—]\s*/gm, ''); // Remove dashes at start of lines
    correctedText = correctedText.replace(/\s*[-–—]\s*/g, ' '); // Remove dashes anywhere
    
    // Remove any remaining bullet-like characters
    correctedText = correctedText.replace(/^\s*[▪▫▬▭▮▯]/gm, ''); // Remove other bullet characters
    correctedText = correctedText.replace(/\s*[▪▫▬▭▮▯]\s*/g, ' '); // Remove other bullet characters anywhere
    
    // Additional aggressive cleaning for any remaining problematic characters
    correctedText = correctedText.replace(/^\s*[○●◐◑◒◓◔◕]/gm, ''); // Remove more bullet types
    correctedText = correctedText.replace(/\s*[○●◐◑◒◓◔◕]\s*/g, ' '); // Remove more bullet types anywhere
    
    // Remove any character that might be interpreted as a bullet
    correctedText = correctedText.replace(/^\s*[▪▫▬▭▮▯○●◐◑◒◓◔◕•·]/gm, ''); // Remove all bullet types at start
    correctedText = correctedText.replace(/\s*[▪▫▬▭▮▯○●◐◑◒◓◔◕•·]\s*/g, ' '); // Remove all bullet types anywhere

    // Clean up line breaks that cause pronunciation issues
    correctedText = correctedText.replace(/\n\s*\n/g, '. '); // Replace double line breaks with period
    correctedText = correctedText.replace(/\n/g, ' '); // Replace single line breaks with space

    // Corrección 1: Mounjaro -> Mounyaro (con Y)
    correctedText = correctedText.replace(/Mounjaro/gi, 'Mounyaro');
    correctedText = correctedText.replace(/mounjaro/gi, 'mounyaro');

    // Corrección 2: GIP -> G I P (deletreo para evitar "GIPE")
    correctedText = correctedText.replace(/\bGIP\b/g, 'G I P');
    correctedText = correctedText.replace(/\bgip\b/g, 'g i p');

    // Corrección 2: mg/ml -> miligramos por mililitro (DEBE IR ANTES que las correcciones individuales)
    correctedText = correctedText.replace(/\bmg\/ml\b/gi, 'miligramos por mililitro');
    correctedText = correctedText.replace(/\bmg\/mL\b/gi, 'miligramos por mililitro');

    // Corrección 3: mcg/ml -> microgramos por mililitro
    correctedText = correctedText.replace(/\bmcg\/ml\b/gi, 'microgramos por mililitro');
    correctedText = correctedText.replace(/\bmcg\/mL\b/gi, 'microgramos por mililitro');

    // Corrección 4: U/ml -> Unidades por mililitro
    correctedText = correctedText.replace(/\bU\/ml\b/gi, 'Unidades por mililitro');
    correctedText = correctedText.replace(/\bU\/mL\b/gi, 'Unidades por mililitro');

    // Corrección 5: Ml -> Mililitros (después de las combinaciones)
    correctedText = correctedText.replace(/\bMl\b/g, 'Mililitros');
    correctedText = correctedText.replace(/\bml\b/g, 'mililitros');
    correctedText = correctedText.replace(/\bML\b/g, 'Mililitros');

    // Corrección 6: Mg -> Miligramos (después de las combinaciones)
    correctedText = correctedText.replace(/\bMg\b/g, 'Miligramos');
    correctedText = correctedText.replace(/\bmg\b/g, 'miligramos');
    correctedText = correctedText.replace(/\bMG\b/g, 'Miligramos');

    // Corrección 7: mcg -> microgramos
    correctedText = correctedText.replace(/\bmcg\b/gi, 'microgramos');

    // Corrección 8: U -> Unidades
    correctedText = correctedText.replace(/\bU\b/g, 'Unidades');
    correctedText = correctedText.replace(/\bu\b/g, 'unidades');

    // Corrección 9: % -> por ciento
    correctedText = correctedText.replace(/(\d+)%/g, '$1 por ciento');

    // Corrección 9.5: Decimales con % -> agregar "punto" para mejor pronunciación
    correctedText = correctedText.replace(/(\d+)\.(\d+)%/g, '$1 punto $2 por ciento');
    
    // Corrección 9.6: Decimales sin % -> agregar "punto" para mejor pronunciación
    correctedText = correctedText.replace(/(\d+)\.(\d+)/g, '$1 punto $2');

    // Corrección 10: + -> más
    correctedText = correctedText.replace(/\s\+\s/g, ' más ');

    // Corrección 11: - -> menos
    correctedText = correctedText.replace(/\s-\s/g, ' menos ');

    // Corrección 12: = -> igual a
    correctedText = correctedText.replace(/\s=\s/g, ' igual a ');

    // Corrección 13: < -> menor que
    correctedText = correctedText.replace(/\s<\s/g, ' menor que ');

    // Corrección 14: > -> mayor que
    correctedText = correctedText.replace(/\s>\s/g, ' mayor que ');

    // Corrección 15: ± -> más menos
    correctedText = correctedText.replace(/\s±\s/g, ' más menos ');

    // Corrección 16: / -> por (cuando está entre números, pero no en combinaciones ya procesadas)
    correctedText = correctedText.replace(/(\d+)\/(\d+)/g, '$1 por $2');

    // Corrección 17: Tirzepatida -> Tirzepatida (asegurar pronunciación correcta)
    correctedText = correctedText.replace(/Tirzepatida/gi, 'Tirzepatida');

    // Clean up excessive spaces after all corrections
    correctedText = correctedText.replace(/\s+/g, ' ');

    console.log('🔊 Pronunciation corrections applied');
    console.log('📝 Original text preview:', text.substring(0, 100) + '...');
    console.log('📝 Corrected text preview:', correctedText.substring(0, 100) + '...');

    return correctedText;
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
    
    // Apply pronunciation corrections first
    let processed = this.correctPronunciation(text);
    
    // Clean up problematic characters and formatting for TTS
    processed = this.cleanTextForTTS(processed);
    
    // Remove extra whitespace and normalize
    processed = processed.trim().replace(/\s+/g, ' ');
    
    // Limit text length for TTS (ElevenLabs has limits)
    const maxLength = 4000; // Increased from 2000 to handle longer responses
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
   * Clean text for better TTS pronunciation
   * @param {string} text - Raw text
   * @returns {string} - Cleaned text
   */
  cleanTextForTTS(text) {
    if (!text) return text;

    let cleaned = text;

    // Remove ALL bullet points and list markers (more aggressive)
    cleaned = cleaned.replace(/^\s*[•·▪▫]\s*/gm, ''); // Remove bullet points at start of lines
    cleaned = cleaned.replace(/\s*[•·▪▫]\s*/g, ' '); // Remove bullet points anywhere
    cleaned = cleaned.replace(/^\s*[-–—]\s*/gm, ''); // Remove dashes at start of lines
    cleaned = cleaned.replace(/\s*[-–—]\s*/g, ' '); // Remove dashes anywhere
    
    // Remove any remaining bullet-like characters
    cleaned = cleaned.replace(/^\s*[▪▫▬▭▮▯]/gm, ''); // Remove other bullet characters
    cleaned = cleaned.replace(/\s*[▪▫▬▭▮▯]\s*/g, ' '); // Remove other bullet characters anywhere
    
    // Additional aggressive cleaning for any remaining problematic characters
    cleaned = cleaned.replace(/^\s*[○●◐◑◒◓◔◕]/gm, ''); // Remove more bullet types
    cleaned = cleaned.replace(/\s*[○●◐◑◒◓◔◕]\s*/g, ' '); // Remove more bullet types anywhere
    
    // Remove any character that might be interpreted as a bullet
    cleaned = cleaned.replace(/^\s*[▪▫▬▭▮▯○●◐◑◒◓◔◕•·]/gm, ''); // Remove all bullet types at start
    cleaned = cleaned.replace(/\s*[▪▫▬▭▮▯○●◐◑◒◓◔◕•·]\s*/g, ' '); // Remove all bullet types anywhere
    
    // Replace numbered lists with proper formatting
    cleaned = cleaned.replace(/^\s*(\d+)\.\s*/gm, '$1. '); // Format numbered lists
    
    // Clean up multiple line breaks and replace with proper spacing
    cleaned = cleaned.replace(/\n\s*\n/g, '. '); // Replace double line breaks with period
    cleaned = cleaned.replace(/\n/g, ' '); // Replace single line breaks with space
    
    // Clean up excessive spaces
    cleaned = cleaned.replace(/\s+/g, ' '); // Multiple spaces to single space
    
    // Clean up section headers (remove colons and format properly)
    cleaned = cleaned.replace(/^([^:]+):\s*$/gm, '$1.'); // Remove colons at end of lines
    cleaned = cleaned.replace(/([^:]+):\s+/g, '$1. '); // Replace colons with periods
    
    // Remove empty lines and excessive spacing
    cleaned = cleaned.replace(/^\s*$/gm, ''); // Remove empty lines
    cleaned = cleaned.replace(/\s{2,}/g, ' '); // Multiple spaces to single
    
    // Ensure proper sentence endings
    cleaned = cleaned.replace(/([.!?])\s*([A-Z])/g, '$1 $2'); // Space after sentence endings
    
    // Handle accented characters for better pronunciation (keep them but ensure proper encoding)
    // Don't remove tildes, just ensure they're properly handled
    cleaned = cleaned.replace(/á/g, 'á');
    cleaned = cleaned.replace(/é/g, 'é');
    cleaned = cleaned.replace(/í/g, 'í');
    cleaned = cleaned.replace(/ó/g, 'ó');
    cleaned = cleaned.replace(/ú/g, 'ú');
    cleaned = cleaned.replace(/ñ/g, 'ñ');
    cleaned = cleaned.replace(/ü/g, 'ü');
    
    // Handle uppercase accented characters too
    cleaned = cleaned.replace(/Á/g, 'Á');
    cleaned = cleaned.replace(/É/g, 'É');
    cleaned = cleaned.replace(/Í/g, 'Í');
    cleaned = cleaned.replace(/Ó/g, 'Ó');
    cleaned = cleaned.replace(/Ú/g, 'Ú');
    cleaned = cleaned.replace(/Ñ/g, 'Ñ');
    cleaned = cleaned.replace(/Ü/g, 'Ü');
    
    // Remove any remaining problematic characters (but keep accented letters)
    cleaned = cleaned.replace(/[^\w\s.,!?;:()%+\-áéíóúñüÁÉÍÓÚÑÜ]/g, ' '); // Keep accented characters
    
    // Final cleanup of multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    console.log('🧹 Text cleaned for TTS');
    console.log('📝 Original preview:', text.substring(0, 100) + '...');
    console.log('📝 Cleaned preview:', cleaned.substring(0, 100) + '...');
    
    return cleaned;
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
      
      // Add timeout for TTS generation - increased for longer responses
      const timeout = 90000; // 90 seconds (increased from 30)
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
   * Generate speech for long responses with extended timeout
   * @param {string} text - Text to convert to speech
   * @param {Object} options - TTS options
   * @returns {Promise<Buffer>} - Audio buffer
   */
  async generateSpeechForLongResponse(text, options = {}) {
    try {
      console.log('🎵 Generating speech for long response:', text.substring(0, 100) + '...');
      
      // Preprocess text for faster processing
      const processedText = this.preprocessText(text);
      
      // Use optimized settings for long responses
      const ttsOptions = {
        voice_id: options.voice_id || this.voiceId,
        model_id: options.model_id || this.modelId,
        voice_settings: {
          stability: 0.5,        // Keep low to save tokens
          similarity_boost: 0.75, // Keep balanced
          style: 0.0,            // Disabled for speed
          use_speaker_boost: false // Disabled for speed
        },
        ...options
      };

      console.log('🎵 Generating speech for long text:', processedText.substring(0, 100) + '...');
      
      // Extended timeout for long responses
      const timeout = 120000; // 120 seconds for very long responses
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const audioBuffer = await elevenLabsConfig.textToSpeech(processedText, ttsOptions);
        clearTimeout(timeoutId);
        
        console.log(`🎵 Generated audio buffer for long response: ${audioBuffer.length} bytes`);
        return audioBuffer;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('TTS generation for long response timed out');
        }
        throw error;
      }

    } catch (error) {
      console.error('❌ Error generating speech for long response:', error);
      throw error;
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
      
      // Determine if this is a long response that needs special handling
      const isLongResponse = text.length > 1500; // Threshold for long responses
      
      let audioBuffer;
      if (isLongResponse) {
        console.log('🎵 Detected long response, using extended timeout...');
        audioBuffer = await this.generateSpeechForLongResponse(text, options);
      } else {
        audioBuffer = await this.generateSpeech(text, options);
      }
      
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