import AudioPipeline from '../services/audioPipeline.js';
import { sendMessage } from '../utils/wsUtils.js';

class ClientHandler {
  constructor(ws) {
    this.ws = ws;
    this.audioPipeline = new AudioPipeline();
    this.conversationHistory = [];
    this.isCallActive = false;
    
    // Estado de la llamada continua
    this.isStreaming = false;
    this.isProcessing = false;
    this.lastAudioLevel = 0;
    
    // Bind event handlers para la llamada continua
    this.audioPipeline.on('callStarted', this.handleCallStarted.bind(this));
    this.audioPipeline.on('callStopped', this.handleCallStopped.bind(this));
    this.audioPipeline.on('transcription', this.handleTranscription.bind(this));
    this.audioPipeline.on('aiResponse', this.handleAIResponse.bind(this));
    this.audioPipeline.on('ttsAudio', this.handleTTSAudio.bind(this));
    this.audioPipeline.on('processingStarted', this.handleProcessingStarted.bind(this));
    this.audioPipeline.on('processingFinished', this.handleProcessingFinished.bind(this));
    this.audioPipeline.on('audioLevel', this.handleAudioLevel.bind(this));
    this.audioPipeline.on('error', this.handleError.bind(this));
  }

  /**
   * Handle incoming WebSocket messages
   * @param {Object} message - Parsed message object
   */
  async handleMessage(message) {
    try {
      switch (message.type) {
        case 'start_call':
          await this.startCall();
          break;
          
        case 'stop_call':
          await this.stopCall();
          break;
          
        case 'audio_chunk':
          await this.handleAudioChunk(message.data);
          break;
          
        case 'reset_conversation':
          await this.resetConversation();
          break;
          
        case 'get_status':
          this.sendStatus();
          break;
          
        case 'ping':
          this.sendPong();
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
          this.sendError('Unknown message type');
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendError('Error processing message');
    }
  }

  /**
   * Iniciar llamada continua
   */
  async startCall() {
    try {
      console.log('🚀 Iniciando llamada continua...');
      console.log('🔍 Estado antes - isCallActive:', this.isCallActive, 'isStreaming:', this.isStreaming);
      
      this.isCallActive = true;
      this.isStreaming = true;
      
      console.log('🔍 Estado después - isCallActive:', this.isCallActive, 'isStreaming:', this.isStreaming);
      
      // Iniciar pipeline de audio
      await this.audioPipeline.startCall();
      
      console.log('✅ AudioPipeline iniciado');
      
      this.sendMessage({
        type: 'call_started',
        message: 'Llamada continua iniciada',
        timestamp: Date.now()
      });
      
      console.log('✅ Llamada continua iniciada');
      
    } catch (error) {
      console.error('❌ Error iniciando llamada continua:', error);
      this.sendError('Error iniciando llamada continua');
    }
  }

  /**
   * Detener llamada continua
   */
  async stopCall() {
    try {
      console.log('🛑 Deteniendo llamada continua...');
      
      this.isCallActive = false;
      this.isStreaming = false;
      this.isProcessing = false;
      
      // Detener pipeline de audio
      this.audioPipeline.stopCall();
      
      this.sendMessage({
        type: 'call_stopped',
        message: 'Llamada continua detenida',
        timestamp: Date.now()
      });
      
      console.log('✅ Llamada continua detenida');
      
    } catch (error) {
      console.error('❌ Error deteniendo llamada continua:', error);
      this.sendError('Error deteniendo llamada continua');
    }
  }

  /**
   * Handle incoming audio chunk for continuous streaming
   * @param {string|Buffer} audioData - Audio data (base64 string or buffer)
   */
  async handleAudioChunk(audioData) {
    console.log('🔍 handleAudioChunk - isCallActive:', this.isCallActive, 'isStreaming:', this.isStreaming);
    
    if (!this.isCallActive || !this.isStreaming) {
      console.log('⚠️ Audio rechazado - llamada inactiva o no streaming');
      return;
    }

    try {
      let audioBuffer;
      if (typeof audioData === 'string') {
        // Convert base64 to buffer
        const binaryString = atob(audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        audioBuffer = Buffer.from(bytes);
      } else {
        audioBuffer = audioData;
      }

      console.log('📤 Enviando audio al pipeline:', audioBuffer.length, 'bytes');
      // Procesar fragmento de audio en tiempo real
      await this.audioPipeline.processAudioChunk(audioBuffer);

    } catch (error) {
      console.error('❌ Error procesando fragmento de audio:', error);
      this.sendError('Error procesando audio');
    }
  }

  /**
   * Handle call started event
   */
  handleCallStarted() {
    console.log('📞 Llamada iniciada en pipeline');
    this.sendStatus('call_active');
  }

  /**
   * Handle call stopped event
   */
  handleCallStopped() {
    console.log('📞 Llamada detenida en pipeline');
    this.sendStatus('ready');
  }

  /**
   * Handle transcription results in real-time
   * @param {Object} transcription - Transcription result
   */
  async handleTranscription(transcription) {
    try {
      console.log('📝 Transcripción en tiempo real:', transcription);
      
      // Enviar transcripción al cliente
      this.sendTranscription(transcription);
      
      // Actualizar estado si es final
      if (transcription.isFinal) {
        console.log('✅ Transcripción final recibida, enviando a procesamiento...');
        this.sendStatus('processing');
      }

    } catch (error) {
      console.error('❌ Error manejando transcripción:', error);
      this.sendError('Error procesando transcripción');
    }
  }

  /**
   * Handle AI response
   * @param {Object} response - AI response object
   */
  async handleAIResponse(response) {
    try {
      console.log('💬 Respuesta de IA recibida:', response.text);
      
      // Agregar a historial de conversación
      this.conversationHistory.push(
        { role: 'user', content: response.userMessage },
        { role: 'assistant', content: response.text }
      );

      // Mantener solo los últimos 20 mensajes
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      // Enviar respuesta de IA
      this.sendAIResponse(response);

    } catch (error) {
      console.error('❌ Error manejando respuesta de IA:', error);
      this.sendError('Error generando respuesta');
    }
  }

  /**
   * Handle TTS audio
   * @param {Object} ttsData - TTS audio data
   */
  async handleTTSAudio(ttsData) {
    try {
      console.log('🔊 Audio TTS recibido:', ttsData.audioBuffer.length, 'bytes');
      
      // Enviar audio al cliente
      this.sendAudio(ttsData.audioBuffer);
      
      // Actualizar estado
      this.sendStatus('speaking');

    } catch (error) {
      console.error('❌ Error manejando audio TTS:', error);
      this.sendError('Error generando speech');
    }
  }

  /**
   * Handle processing started
   */
  handleProcessingStarted() {
    console.log('🤖 Procesamiento iniciado');
    this.isProcessing = true;
    this.sendStatus('processing');
  }

  /**
   * Handle processing finished
   */
  handleProcessingFinished() {
    console.log('✅ Procesamiento completado');
    this.isProcessing = false;
    this.sendStatus('call_active');
  }

  /**
   * Handle audio level updates
   * @param {number} audioLevel - Audio level (0-1)
   */
  handleAudioLevel(audioLevel) {
    this.lastAudioLevel = audioLevel;
    
    // Enviar nivel de audio al cliente para visualización
    this.sendMessage({
      type: 'audio_level',
      level: audioLevel,
      timestamp: Date.now()
    });
  }

  /**
   * Handle errors from the audio pipeline
   * @param {Error} error - Error object
   */
  handleError(error) {
    console.error('❌ Error del pipeline de audio:', error);
    this.sendError(error.message);
    this.sendStatus('error');
  }

  /**
   * Reset the conversation
   */
  async resetConversation() {
    try {
      this.conversationHistory = [];
      this.audioPipeline.reset();
      this.sendMessage({
        type: 'conversation_reset',
        message: 'Conversación reiniciada',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('❌ Error reiniciando conversación:', error);
      this.sendError('Error reiniciando conversación');
    }
  }

  /**
   * Send pong response
   */
  sendPong() {
    this.sendMessage({
      type: 'pong',
      timestamp: Date.now()
    });
  }

  /**
   * Send current status
   */
  sendStatus() {
    const status = this.audioPipeline.getStatus();
    this.sendMessage({
      type: 'status',
      status: status,
      timestamp: Date.now()
    });
  }

  /**
   * Send status update
   * @param {string} status - Current status
   */
  sendStatus(status) {
    this.sendMessage({
      type: 'status',
      status: status,
      timestamp: Date.now()
    });
  }

  /**
   * Send transcription update
   * @param {Object} transcription - Transcription result
   */
  sendTranscription(transcription) {
    this.sendMessage({
      type: 'transcription',
      text: transcription.text,
      isFinal: transcription.isFinal,
      confidence: transcription.confidence,
      timestamp: Date.now()
    });
  }

  /**
   * Send AI response
   * @param {Object} response - AI response object
   */
  sendAIResponse(response) {
    this.sendMessage({
      type: 'ai_response',
      text: response.text,
      userMessage: response.userMessage,
      timestamp: response.timestamp
    });
  }

  /**
   * Send audio buffer
   * @param {Buffer} audioBuffer - Audio buffer
   */
  sendAudio(audioBuffer) {
    try {
      console.log('📤 Enviando audio al cliente, tamaño:', audioBuffer.length, 'bytes');
      
      const base64Audio = audioBuffer.toString('base64');
      
      this.sendMessage({
        type: 'audio',
        data: base64Audio,
        timestamp: Date.now()
      });
      
      console.log('✅ Audio enviado exitosamente');
    } catch (error) {
      console.error('❌ Error enviando audio:', error);
    }
  }

  /**
   * Send error message
   * @param {string} error - Error message
   */
  sendError(error) {
    this.sendMessage({
      type: 'error',
      message: error,
      timestamp: Date.now()
    });
  }

  /**
   * Send message to client
   * @param {Object} message - Message object
   */
  sendMessage(message) {
    if (this.ws.readyState === this.ws.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.isCallActive) {
      this.stopCall();
    }
    
    if (this.audioPipeline) {
      this.audioPipeline.cleanup();
    }
  }
}

export default ClientHandler; 