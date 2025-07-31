import { EventEmitter } from 'events';
import deepgramConfig from '../config/deepgram.js';
import ChatService from './chatService.js';
import TTSService from './ttsService.js';
import SilenceDetector from '../utils/silenceDetector.js';

class AudioPipeline extends EventEmitter {
  constructor() {
    super();
    
    this.chatService = new ChatService();
    this.ttsService = new TTSService();
    this.silenceDetector = new SilenceDetector({
      threshold: 0.001, // Umbral muy bajo para mayor sensibilidad
      minSilenceDuration: 300, // 300ms de silencio (más rápido)
      sampleRate: 16000,
      channels: 1,
      historySize: 5, // Historial más corto para respuesta más rápida
      smoothingFactor: 0.4 // Más suavizado
    });
    
    // Estado de la llamada continua
    this.isCallActive = false;
    this.isProcessing = false;
    this.isUserSpeaking = false;
    this.isTTSPlaying = false; // Nuevo: controlar cuando ElevenLabs está hablando
    
    // Buffers para streaming continuo
    this.audioBuffer = Buffer.alloc(0);
    this.streamingBuffer = Buffer.alloc(0);
    this.currentTranscription = '';
    this.accumulatedTranscription = '';
    
    // Configuración de streaming
    this.sampleRate = 16000;
    this.channels = 1;
    this.bytesPerSample = 2; // 16-bit
    this.chunkSize = 3200; // 100ms a 16kHz (16000 * 0.1 * 2)
    this.maxBufferSize = 64000; // 2 segundos máximo
    
    // Deepgram WebSocket
    this.deepgramWs = null;
    this.isConnected = false;
    this.transcriptionQueue = [];
    
    // Temporizadores para control de flujo
    this.silenceTimer = null;
    this.processingTimer = null;
    this.keepAliveTimer = null;
    this.fallbackTimer = null; // Nuevo temporizador para fallback
    
    // Configuración de la llamada continua
    this.silenceThreshold = 300; // ms
    this.processingDelay = 100; // ms para procesar después del silencio
    this.keepAliveInterval = 30000; // ms
    this.fallbackProcessingTime = 2000; // ms - procesar transcripciones pendientes después de 2 segundos
    
    // Bind methods
    this.processAudioChunk = this.processAudioChunk.bind(this);
    this.handleSilenceDetected = this.handleSilenceDetected.bind(this);
    this.handleAudioResumed = this.handleAudioResumed.bind(this);
    this.handleDeepgramTranscription = this.handleDeepgramTranscription.bind(this);
    this.handleDeepgramError = this.handleDeepgramError.bind(this);
    this.processAccumulatedTranscription = this.processAccumulatedTranscription.bind(this);
    this.sendKeepAlive = this.sendKeepAlive.bind(this);
    
    // Configurar callbacks del detector de silencio
    this.silenceDetector.onSilence(this.handleSilenceDetected);
    this.silenceDetector.onAudioResume(this.handleAudioResumed);
  }

  /**
   * Iniciar llamada continua
   */
  async startCall() {
    try {
      console.log('🚀 Iniciando llamada continua...');
      console.log('🔍 Estado antes de startCall - isCallActive:', this.isCallActive);
      
      this.isCallActive = true;
      console.log('🔒 isCallActive establecido a TRUE');
      this.isProcessing = false;
      this.isUserSpeaking = false;
      
      // Limpiar buffers
      this.audioBuffer = Buffer.alloc(0);
      this.streamingBuffer = Buffer.alloc(0);
      this.currentTranscription = '';
      this.accumulatedTranscription = '';
      this.transcriptionQueue = [];
      
      // Inicializar conexión Deepgram
      await this.initializeDeepgramConnection();
      
      // Iniciar keep-alive
      this.startKeepAlive();
      
      console.log('✅ Llamada continua iniciada');
      this.emit('callStarted');
      
    } catch (error) {
      console.error('❌ Error iniciando llamada continua:', error);
      this.emit('error', error);
    }
  }

  /**
   * Detener llamada continua
   */
  stopCall() {
    console.log('🛑 Deteniendo llamada continua...');
    console.log('🔍 Estado antes de stopCall - isCallActive:', this.isCallActive);
    
    this.isCallActive = false;
    console.log('🔓 isCallActive establecido a FALSE');
    this.isProcessing = false;
    this.isUserSpeaking = false;
    
    // Limpiar temporizadores
    this.clearTimers();
    
    // Cerrar conexión Deepgram
    if (this.deepgramWs) {
      deepgramConfig.closeConnection(this.deepgramWs);
      this.deepgramWs = null;
      this.isConnected = false;
    }
    
    // Limpiar buffers
    this.audioBuffer = Buffer.alloc(0);
    this.streamingBuffer = Buffer.alloc(0);
    this.currentTranscription = '';
    this.accumulatedTranscription = '';
    this.transcriptionQueue = [];
    
    console.log('✅ Llamada continua detenida');
    this.emit('callStopped');
  }

  /**
   * Procesar fragmento de audio en tiempo real
   * @param {Buffer} audioChunk - Fragmento de audio
   */
  async processAudioChunk(audioChunk) {
    if (!this.isCallActive) {
      return;
    }

    try {
      // Detectar silencio (solo para logs)
      const silenceResult = this.silenceDetector.processAudio(audioChunk);
      
      // Acumular audio para streaming
      this.streamingBuffer = Buffer.concat([this.streamingBuffer, audioChunk]);
      
      // Enviar a Deepgram si hay conexión y no estamos reproduciendo TTS
      if (this.deepgramWs && this.isConnected && !this.isTTSPlaying) {
        deepgramConfig.sendAudioChunk(this.deepgramWs, audioChunk);
      } else {
        if (!this.deepgramWs) {
          console.log('⚠️ Deepgram WebSocket no disponible');
        } else if (!this.isConnected) {
          console.log('⚠️ Deepgram no conectado');
        } else if (this.isTTSPlaying) {
          console.log('⏸️ TTS reproduciendo, pausando audio a Deepgram');
        }
      }
      
      // Controlar tamaño del buffer
      if (this.streamingBuffer.length > this.maxBufferSize) {
        this.streamingBuffer = this.streamingBuffer.slice(-this.maxBufferSize);
      }
      
      // Emitir nivel de audio para UI
      this.emit('audioLevel', silenceResult.audioLevel);
      
      // Log detallado de silencio
      if (silenceResult.isSilent) {
        console.log(`🔇 Silencio detectado: ${silenceResult.silenceDuration}ms, nivel: ${silenceResult.audioLevel.toFixed(4)}`);
      }
      
    } catch (error) {
      console.error('❌ Error procesando fragmento de audio:', error);
      this.emit('error', error);
    }
  }

  /**
   * Manejar detección de silencio
   * @param {number} silenceDuration - Duración del silencio en ms
   */
  handleSilenceDetected(silenceDuration) {
    if (!this.isCallActive) {
      return;
    }

    console.log(`🔇 Silencio detectado: ${silenceDuration}ms`);
  }

  /**
   * Manejar resumen de audio después del silencio
   * @param {number} audioLevel - Nivel de audio
   */
  handleAudioResumed(audioLevel) {
    if (!this.isCallActive) {
      return;
    }

    console.log(`🔊 Audio resumido, nivel: ${audioLevel.toFixed(3)}`);
    this.isUserSpeaking = true;
  }

  /**
   * Manejar transcripción de Deepgram
   * @param {Object} transcription - Resultado de transcripción
   */
  handleDeepgramTranscription(transcription) {
    if (!this.isCallActive) {
      console.log('⚠️ Llamada no activa, ignorando transcripción');
      return;
    }

    try {
      // Solo logear transcripciones con contenido
      if (transcription.text && transcription.text.trim().length > 0) {
        console.log('📝 Transcripción recibida:', transcription);
      }
      
      if (transcription.text && transcription.text.trim().length > 0) {
        // Para transcripciones no finales, solo acumular
        if (!transcription.isFinal) {
          // Acumular transcripción parcial
          if (this.accumulatedTranscription) {
            this.accumulatedTranscription += ' ' + transcription.text.trim();
          } else {
            this.accumulatedTranscription = transcription.text.trim();
          }
          
          console.log('📝 Transcripción parcial acumulada:', this.accumulatedTranscription);
        } else {
          // Para transcripciones finales, procesar inmediatamente
          const finalText = transcription.text.trim();
          
          console.log('🎯 TRANSCRIPCIÓN FINAL DETECTADA:', finalText);
          console.log('🔍 Estado actual - isProcessing:', this.isProcessing, 'isTTSPlaying:', this.isTTSPlaying);
          
          // Resetear transcripción acumulada
          this.accumulatedTranscription = '';
          
          // Procesar inmediatamente si no estamos procesando ni reproduciendo TTS
          if (!this.isProcessing && !this.isTTSPlaying) {
            console.log('⚡ PROCESANDO TRANSCRIPCIÓN INMEDIATAMENTE...');
            this.processTranscriptionImmediately(finalText, transcription.confidence);
          } else {
            console.log('⏸️ PAUSADO - ya procesando o TTS reproduciendo');
            console.log('📋 Agregando a cola para procesar después...');
            // Agregar a cola para procesar después
            this.transcriptionQueue.push({
              text: finalText,
              confidence: transcription.confidence,
              timestamp: Date.now()
            });
            console.log('📊 Cola actual:', this.transcriptionQueue.length, 'elementos');
          }
        }
        
        // Emitir transcripción en tiempo real
        this.emit('transcription', {
          text: transcription.text,
          isFinal: transcription.isFinal,
          confidence: transcription.confidence
        });
      } else {
        console.log('⚠️ Transcripción vacía recibida:', transcription);
      }

    } catch (error) {
      console.error('❌ Error manejando transcripción:', error);
      this.emit('error', error);
    }
  }

  /**
   * Procesar transcripción inmediatamente
   * @param {string} text - Texto de la transcripción
   * @param {number} confidence - Confianza de la transcripción
   */
  async processTranscriptionImmediately(text, confidence) {
    console.log('🚀 Iniciando processTranscriptionImmediately...');
    console.log('📝 Texto a procesar:', text);
    console.log('🔍 Estado - isCallActive:', this.isCallActive, 'isProcessing:', this.isProcessing);
    
    if (!this.isCallActive || this.isProcessing) {
      console.log('⚠️ No se puede procesar - llamada inactiva o ya procesando');
      return;
    }

    console.log('🤖 Procesando transcripción inmediatamente:', text);

    this.isProcessing = true;
    console.log('🔒 isProcessing establecido a TRUE');
    this.emit('processingStarted');

    try {
      // Generar respuesta de IA con timeout
      console.log('💭 Enviando a ChatGPT:', text);
      console.log('🔍 ChatService disponible:', !!this.chatService);
      
      // Crear timeout para la llamada a OpenAI
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OpenAI request timed out after 15 seconds')), 15000);
      });
      
      const aiResponsePromise = this.chatService.generateResponse(text);
      
      const aiResponse = await Promise.race([aiResponsePromise, timeoutPromise]);
      
      console.log('💬 Respuesta de IA recibida:', aiResponse);
      
      // Emitir respuesta
      console.log('📤 Emitiendo respuesta de IA...');
      this.emit('aiResponse', {
        text: aiResponse,
        userMessage: text,
        timestamp: Date.now()
      });
      
      // Generar audio de respuesta
      console.log('🔊 Generando audio con ElevenLabs...');
      console.log('🔍 TTSService disponible:', !!this.ttsService);
      
      this.isTTSPlaying = true; // Marcar que TTS está reproduciendo
      console.log('🔒 isTTSPlaying establecido a TRUE');
      await this.generateSpeech(aiResponse);

    } catch (error) {
      console.error('❌ Error procesando transcripción:', error);
      console.error('❌ Error stack:', error.stack);
      this.emit('error', error);
    } finally {
      this.isProcessing = false;
      console.log('🔓 isProcessing establecido a FALSE');
      this.emit('processingFinished');
      console.log('✅ Procesamiento completado');
    }
  }

  /**
   * Procesar transcripción acumulada (método heredado para compatibilidad)
   */
  async processAccumulatedTranscription() {
    console.log('⚠️ Este método está deprecado, usar processTranscriptionImmediately');
  }

  /**
   * Generar speech de respuesta
   * @param {string} text - Texto para convertir a speech
   */
  async generateSpeech(text) {
    try {
      console.log('🔊 Iniciando generateSpeech...');
      console.log('📝 Texto para TTS:', text);
      console.log('🔍 Estado isTTSPlaying antes:', this.isTTSPlaying);
      
      if (!text || text.trim().length === 0) {
        console.log('⚠️ Texto vacío, saltando TTS');
        this.isTTSPlaying = false;
        console.log('🔓 isTTSPlaying establecido a FALSE (texto vacío)');
        return;
      }

      console.log('🔊 Generando speech para:', text);

      const audioBuffer = await this.ttsService.generateSpeech(text);
      
      console.log(`🎵 Audio generado: ${audioBuffer.length} bytes`);
      
      this.emit('ttsAudio', {
        audioBuffer,
        text,
        timestamp: Date.now()
      });

      // Marcar que TTS terminó de reproducir
      this.isTTSPlaying = false;
      console.log('🔓 isTTSPlaying establecido a FALSE (TTS completado)');

      // Procesar cola pendiente si hay transcripciones
      if (this.transcriptionQueue.length > 0) {
        console.log('🔄 Procesando cola pendiente después de TTS...');
        const nextTranscription = this.transcriptionQueue.shift();
        console.log('📝 Próxima transcripción de cola:', nextTranscription.text);
        await this.processTranscriptionImmediately(nextTranscription.text, nextTranscription.confidence);
      } else {
        console.log('📋 No hay transcripciones en cola para procesar');
      }

    } catch (error) {
      console.error('❌ Error generando speech:', error);
      this.isTTSPlaying = false;
      console.log('🔓 isTTSPlaying establecido a FALSE (error)');
      this.emit('error', error);
    }
  }

  /**
   * Inicializar conexión Deepgram
   */
  async initializeDeepgramConnection() {
    try {
      console.log('🔌 Inicializando conexión Deepgram...');
      
      this.deepgramWs = deepgramConfig.createStreamingConnection(
        (transcription) => {
          console.log('📝 Transcripción recibida de Deepgram en AudioPipeline:', transcription);
          this.handleDeepgramTranscription(transcription);
        },
        this.handleDeepgramError
      );
      
      if (this.deepgramWs) {
        this.isConnected = true;
        console.log('✅ Conexión Deepgram inicializada');
      } else {
        console.log('❌ No se pudo inicializar la conexión Deepgram');
        this.isConnected = false;
      }
    } catch (error) {
      console.error('❌ Error inicializando Deepgram:', error);
      this.isConnected = false;
      this.emit('error', error);
    }
  }

  /**
   * Manejar errores de Deepgram
   * @param {Error} error - Error de Deepgram
   */
  handleDeepgramError(error) {
    console.error('❌ Error de Deepgram:', error);
    this.isConnected = false;
    this.emit('error', error);
    
    // Reintentar conexión después de un delay
    setTimeout(() => {
      if (this.isCallActive) {
        this.initializeDeepgramConnection();
      }
    }, 5000);
  }

  /**
   * Iniciar keep-alive
   */
  startKeepAlive() {
    this.keepAliveTimer = setInterval(() => {
      this.sendKeepAlive();
    }, this.keepAliveInterval);
  }

  /**
   * Enviar keep-alive
   */
  sendKeepAlive() {
    if (this.isCallActive && this.deepgramWs && this.isConnected) {
      try {
        // Enviar buffer vacío como keep-alive
        deepgramConfig.sendAudioChunk(this.deepgramWs, Buffer.alloc(0));
        console.log('💓 Keep-alive enviado');
      } catch (error) {
        console.error('❌ Error enviando keep-alive:', error);
      }
    }
  }

  /**
   * Limpiar temporizadores
   */
  clearTimers() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  /**
   * Obtener estado actual
   */
  getStatus() {
    return {
      isCallActive: this.isCallActive,
      isProcessing: this.isProcessing,
      isUserSpeaking: this.isUserSpeaking,
      isTTSPlaying: this.isTTSPlaying,
      isConnected: this.isConnected,
      audioBufferSize: this.streamingBuffer.length,
      transcriptionQueueLength: this.transcriptionQueue.length,
      currentTranscription: this.accumulatedTranscription,
      conversationHistoryLength: this.chatService.getHistory().length
    };
  }

  /**
   * Actualizar configuración
   * @param {Object} config - Nueva configuración
   */
  updateConfig(config) {
    if (config.silenceThreshold !== undefined) {
      this.silenceThreshold = config.silenceThreshold;
    }
    if (config.processingDelay !== undefined) {
      this.processingDelay = config.processingDelay;
    }
    if (config.keepAliveInterval !== undefined) {
      this.keepAliveInterval = config.keepAliveInterval;
    }
    if (config.fallbackProcessingTime !== undefined) {
      this.fallbackProcessingTime = config.fallbackProcessingTime;
    }
    
    // Actualizar detector de silencio
    if (config.silenceDetector) {
      this.silenceDetector.updateConfig(config.silenceDetector);
    }
  }

  /**
   * Limpiar recursos
   */
  cleanup() {
    this.stopCall();
    this.chatService.clearHistory();
    this.silenceDetector.reset();
  }

  // Métodos heredados para compatibilidad
  processAudio(audioBuffer) {
    return this.processAudioChunk(audioBuffer);
  }

  processTranscription(transcription) {
    return this.processAccumulatedTranscription();
  }

  generateSpeech(text) {
    return this.generateSpeech(text);
  }

  stop() {
    return this.stopCall();
  }

  reset() {
    this.stopCall();
    this.chatService.clearHistory();
  }

  getConversationHistory() {
    return this.chatService.getHistory();
  }

  setConversationHistory(history) {
    this.chatService.setHistory(history);
  }

  getConversationSummary() {
    return this.chatService.getConversationSummary();
  }

  updateTTSSettings(settings) {
    this.ttsService.setVoiceSettings(settings);
  }

  updateTTSVoice(voiceId) {
    this.ttsService.setVoiceId(voiceId);
  }

  async validateServices() {
    const results = {
      deepgram: false,
      openai: false,
      elevenlabs: false
    };

    try {
      results.deepgram = await deepgramConfig.validateApiKey();
    } catch (error) {
      console.error('Deepgram validation failed:', error);
    }

    try {
      results.openai = await this.chatService.openAIConfig?.validateApiKey() || false;
    } catch (error) {
      console.error('OpenAI validation failed:', error);
    }

    try {
      results.elevenlabs = await this.ttsService.elevenLabsConfig?.validateApiKey() || false;
    } catch (error) {
      console.error('ElevenLabs validation failed:', error);
    }

    return results;
  }

  async getAvailableVoices() {
    return await this.ttsService.getAvailableVoices();
  }

  getAvailableModels() {
    return deepgramConfig.getAvailableModels();
  }

  getAvailableLanguages() {
    return deepgramConfig.getAvailableLanguages();
  }
}

export default AudioPipeline; 