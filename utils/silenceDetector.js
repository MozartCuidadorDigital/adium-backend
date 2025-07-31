class SilenceDetector {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.005; // Umbral más bajo para mayor sensibilidad
    this.minSilenceDuration = options.minSilenceDuration || 800; // 800ms de silencio
    this.sampleRate = options.sampleRate || 16000;
    this.channels = options.channels || 1;
    
    this.isSilent = false;
    this.silenceStartTime = null;
    this.lastAudioLevel = 0;
    this.onSilenceDetected = null;
    this.onAudioResumed = null;
    
    // Configuración adicional para mejor detección
    this.audioLevelHistory = [];
    this.historySize = 10;
    this.smoothingFactor = 0.3;
  }

  /**
   * Set callback for when silence is detected
   * @param {Function} callback - Callback function
   */
  onSilence(callback) {
    this.onSilenceDetected = callback;
  }

  /**
   * Set callback for when audio resumes
   * @param {Function} callback - Callback function
   */
  onAudioResume(callback) {
    this.onAudioResumed = callback;
  }

  /**
   * Process audio buffer and detect silence
   * @param {Buffer} audioBuffer - Audio buffer to analyze
   * @returns {Object} - Analysis result
   */
  processAudio(audioBuffer) {
    const rawAudioLevel = this.calculateAudioLevel(audioBuffer);
    const smoothedLevel = this.smoothAudioLevel(rawAudioLevel);
    const currentTime = Date.now();
    
    const result = {
      audioLevel: smoothedLevel,
      isSilent: false,
      silenceDuration: 0,
      shouldCutoff: false
    };

    // Check if current audio level is below threshold
    if (smoothedLevel < this.threshold) {
      if (!this.isSilent) {
        // Just started being silent
        this.isSilent = true;
        this.silenceStartTime = currentTime;
        console.log(`🔇 Silencio iniciado, nivel: ${smoothedLevel.toFixed(4)}`);
      } else {
        // Still silent, check duration
        const silenceDuration = currentTime - this.silenceStartTime;
        result.silenceDuration = silenceDuration;
        result.isSilent = true;
        
        // Check if silence duration exceeds minimum
        if (silenceDuration >= this.minSilenceDuration) {
          result.shouldCutoff = true;
          
          // Trigger silence detected callback
          if (this.onSilenceDetected) {
            this.onSilenceDetected(silenceDuration);
          }
        }
      }
    } else {
      // Audio detected
      if (this.isSilent) {
        // Audio resumed after silence
        this.isSilent = false;
        this.silenceStartTime = null;
        
        console.log(`🔊 Audio resumido, nivel: ${smoothedLevel.toFixed(4)}`);
        
        // Trigger audio resumed callback
        if (this.onAudioResumed) {
          this.onAudioResumed(smoothedLevel);
        }
      }
    }

    this.lastAudioLevel = smoothedLevel;
    return result;
  }

  /**
   * Smooth audio level using moving average
   * @param {number} currentLevel - Current audio level
   * @returns {number} - Smoothed audio level
   */
  smoothAudioLevel(currentLevel) {
    // Add current level to history
    this.audioLevelHistory.push(currentLevel);
    
    // Keep only the last N samples
    if (this.audioLevelHistory.length > this.historySize) {
      this.audioLevelHistory.shift();
    }
    
    // Calculate moving average
    const sum = this.audioLevelHistory.reduce((a, b) => a + b, 0);
    const average = sum / this.audioLevelHistory.length;
    
    // Apply smoothing factor
    const smoothed = (this.lastAudioLevel * (1 - this.smoothingFactor)) + (average * this.smoothingFactor);
    
    return smoothed;
  }

  /**
   * Calculate audio level from buffer
   * @param {Buffer} audioBuffer - Audio buffer
   * @returns {number} - Audio level (0-1)
   */
  calculateAudioLevel(audioBuffer) {
    if (!audioBuffer || audioBuffer.length === 0) {
      return 0;
    }

    try {
      // Convert buffer to 16-bit PCM samples
      const samples = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / 2);
      
      // Calculate RMS (Root Mean Square) for audio level
      let sum = 0;
      let count = 0;
      
      // Sample every 10th value for performance and noise reduction
      const step = Math.max(1, Math.floor(samples.length / 100));
      
      for (let i = 0; i < samples.length; i += step) {
        sum += samples[i] * samples[i];
        count++;
      }
      
      if (count === 0) return 0;
      
      const rms = Math.sqrt(sum / count);
      const maxValue = 32767; // Maximum value for 16-bit audio
      
      return rms / maxValue;
    } catch (error) {
      console.error('Error calculating audio level:', error);
      return 0;
    }
  }

  /**
   * Calculate audio level using a simpler method (for performance)
   * @param {Buffer} audioBuffer - Audio buffer
   * @returns {number} - Audio level (0-1)
   */
  calculateAudioLevelSimple(audioBuffer) {
    if (!audioBuffer || audioBuffer.length === 0) {
      return 0;
    }

    // Sample every 100th value for performance
    const step = Math.max(1, Math.floor(audioBuffer.length / 100));
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < audioBuffer.length; i += step) {
      const sample = audioBuffer[i];
      sum += Math.abs(sample);
      count++;
    }
    
    if (count === 0) return 0;
    
    const average = sum / count;
    return average / 255; // Normalize to 0-1 range
  }

  /**
   * Reset silence detection state
   */
  reset() {
    this.isSilent = false;
    this.silenceStartTime = null;
    this.lastAudioLevel = 0;
    this.audioLevelHistory = [];
  }

  /**
   * Update configuration
   * @param {Object} options - New configuration options
   */
  updateConfig(options) {
    if (options.threshold !== undefined) {
      this.threshold = options.threshold;
    }
    if (options.minSilenceDuration !== undefined) {
      this.minSilenceDuration = options.minSilenceDuration;
    }
    if (options.sampleRate !== undefined) {
      this.sampleRate = options.sampleRate;
    }
    if (options.channels !== undefined) {
      this.channels = options.channels;
    }
    if (options.historySize !== undefined) {
      this.historySize = options.historySize;
    }
    if (options.smoothingFactor !== undefined) {
      this.smoothingFactor = options.smoothingFactor;
    }
  }

  /**
   * Get current configuration
   * @returns {Object} - Current configuration
   */
  getConfig() {
    return {
      threshold: this.threshold,
      minSilenceDuration: this.minSilenceDuration,
      sampleRate: this.sampleRate,
      channels: this.channels,
      historySize: this.historySize,
      smoothingFactor: this.smoothingFactor
    };
  }

  /**
   * Get current state
   * @returns {Object} - Current state
   */
  getState() {
    return {
      isSilent: this.isSilent,
      silenceStartTime: this.silenceStartTime,
      lastAudioLevel: this.lastAudioLevel,
      currentSilenceDuration: this.isSilent && this.silenceStartTime 
        ? Date.now() - this.silenceStartTime 
        : 0,
      audioLevelHistory: this.audioLevelHistory.length
    };
  }

  /**
   * Check if currently silent
   * @returns {boolean} - Whether currently silent
   */
  isCurrentlySilent() {
    return this.isSilent;
  }

  /**
   * Get current silence duration
   * @returns {number} - Current silence duration in milliseconds
   */
  getCurrentSilenceDuration() {
    if (!this.isSilent || !this.silenceStartTime) {
      return 0;
    }
    return Date.now() - this.silenceStartTime;
  }
}

export default SilenceDetector; 