import axios from 'axios';
import dotenv from 'dotenv';
import WebSocket from 'ws';

dotenv.config();

class DeepgramConfig {
  constructor() {
    this.apiKey = process.env.DEEPGRAM_API_KEY;
    this.baseURL = 'https://api.deepgram.com/v1';
    this.model = process.env.DEEPGRAM_MODEL || 'nova-2';
    this.language = process.env.DEEPGRAM_LANGUAGE || 'es-ES';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create WebSocket connection for real-time streaming
   * @param {Function} onTranscription - Callback for transcription results
   * @param {Function} onError - Callback for errors
   * @returns {WebSocket} - WebSocket connection
   */
  createStreamingConnection(onTranscription, onError) {
    try {
      const params = new URLSearchParams({
        model: this.model,
        language: this.language,
        smart_format: 'true',
        punctuate: 'true',
        interim_results: 'true',
        diarize: 'false',
        utterances: 'false',
        profanity_filter: 'false'
      });

      const wsUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
      
      console.log('Creating Deepgram WebSocket connection:', wsUrl);
      
      const ws = new WebSocket(wsUrl, {
        headers: {
          'Authorization': `Token ${this.apiKey}`
        }
      });

      ws.on('open', () => {
        console.log('Deepgram WebSocket connected');
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'Results') {
            const transcription = this.processTranscriptionResult(message);
            
            // Solo logear transcripciones con contenido
            if (transcription.text && transcription.text.trim().length > 0) {
              console.log('📝 Procesando transcripción de Deepgram:', transcription);
            }
            
            onTranscription(transcription);
          }
        } catch (error) {
          console.error('Error parsing Deepgram message:', error);
        }
      });

      ws.on('error', (error) => {
        console.error('Deepgram WebSocket error:', error);
        onError(error);
      });

      ws.on('close', (code, reason) => {
        console.log('Deepgram WebSocket closed:', code, reason);
      });

      return ws;
    } catch (error) {
      console.error('Error creating Deepgram streaming connection:', error);
      onError(error);
      return null;
    }
  }

  /**
   * Send audio chunk to WebSocket connection
   * @param {WebSocket} ws - WebSocket connection
   * @param {Buffer} audioChunk - Audio chunk to send
   */
  sendAudioChunk(ws, audioChunk) {
    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(audioChunk);
      }
    } catch (error) {
      console.error('Error sending audio chunk to Deepgram:', error);
    }
  }

  /**
   * Close WebSocket connection
   * @param {WebSocket} ws - WebSocket connection
   */
  closeConnection(ws) {
    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    } catch (error) {
      console.error('Error closing Deepgram connection:', error);
    }
  }

  /**
   * Process transcription result from WebSocket
   * @param {Object} result - Raw transcription result
   * @returns {Object} - Processed transcription
   */
  processTranscriptionResult(result) {
    try {
      if (!result.channel || !result.channel.alternatives || result.channel.alternatives.length === 0) {
        return {
          text: '',
          isFinal: false,
          confidence: 0,
          words: []
        };
      }

      const alternative = result.channel.alternatives[0];
      const isFinal = !result.is_final || result.is_final === false ? false : true;

      return {
        text: alternative.transcript || '',
        isFinal: isFinal,
        confidence: alternative.confidence || 0,
        words: alternative.words || []
      };
    } catch (error) {
      console.error('Error processing transcription result:', error);
      return {
        text: '',
        isFinal: false,
        confidence: 0,
        words: []
      };
    }
  }

  /**
   * Validate API key
   * @returns {Promise<boolean>} - True if valid
   */
  async validateApiKey() {
    try {
      // Use a different endpoint that exists
      const response = await this.client.get('/projects');
      console.log('Deepgram API key is valid');
      return true;
    } catch (error) {
      console.error('Deepgram API key validation failed:', error);
      return false;
    }
  }

  /**
   * Get available models
   * @returns {Promise<Array>} - List of available models
   */
  async getAvailableModels() {
    try {
      const response = await this.client.get('/models');
      return response.data.models || [];
    } catch (error) {
      console.error('Error getting Deepgram models:', error);
      return [];
    }
  }

  /**
   * Get available languages
   * @returns {Promise<Array>} - List of available languages
   */
  async getAvailableLanguages() {
    try {
      const response = await this.client.get('/languages');
      return response.data.languages || [];
    } catch (error) {
      console.error('Error getting Deepgram languages:', error);
      return [];
    }
  }
}

const deepgramConfig = new DeepgramConfig();
export default deepgramConfig; 