import TirzepatidaStudiesService from '../services/tirzepatidaStudiesService.js';

/**
 * Controlador para manejar las preguntas de estudios de Tirzepatida (SURPASS y SURMOUNT)
 * Completamente separado del totemController para evitar conflictos
 */
class TirzepatidaStudiesController {
  constructor() {
    this.studiesService = new TirzepatidaStudiesService();
  }

  /**
   * Procesa una pregunta de estudio y retorna la respuesta con audio e imagen
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  processStudyQuestion = async (req, res) => {
    try {
      const { question } = req.body;

      if (!question || question.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'La pregunta es requerida'
        });
      }

      console.log('📊 Studies Controller - Processing study question:', question);

      // Intentar obtener la respuesta del estudio con audio
      const result = await this.studiesService.generateStudyResponseWithAudio(question);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Pregunta de estudio no encontrada',
          message: 'Esta pregunta no está en la lista de estudios SURPASS y SURMOUNT'
        });
      }

      console.log('✅ Study response generated successfully');
      console.log('🖼️ Image:', result.image);
      console.log('🎵 Audio URL:', result.audioUrl ? 'Generated' : 'Not available');

      return res.json({
        success: true,
        text: result.text,
        audioUrl: result.audioUrl,
        image: result.image,
        predefined: true
      });

    } catch (error) {
      console.error('❌ Studies Controller Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'Lo siento, ocurrió un error al procesar tu pregunta sobre estudios.'
      });
    }
  };

  /**
   * Obtiene todas las preguntas de estudios disponibles
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getStudiesQuestions = async (req, res) => {
    try {
      console.log('📊 Studies Controller - Getting all studies questions');
      
      const questions = this.studiesService.getStudiesQuestions();
      
      return res.json({
        success: true,
        questions: questions,
        total: questions.length
      });

    } catch (error) {
      console.error('❌ Get Studies Questions Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener las preguntas de estudios'
      });
    }
  };

  /**
   * Obtiene estadísticas del cache de audio
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCacheStats = async (req, res) => {
    try {
      const stats = this.studiesService.getCacheStats();
      
      return res.json({
        success: true,
        stats: stats
      });

    } catch (error) {
      console.error('❌ Get Cache Stats Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener estadísticas del cache'
      });
    }
  };

  /**
   * Pre-carga todos los audios (opcional, para optimización)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  preloadAudios = async (req, res) => {
    try {
      console.log('🔄 Studies Controller - Preloading all audios...');
      
      // Ejecutar en background para no bloquear la respuesta
      this.studiesService.preloadAllAudios().then(() => {
        console.log('✅ All audios preloaded successfully');
      }).catch((error) => {
        console.error('❌ Error preloading audios:', error);
      });
      
      return res.json({
        success: true,
        message: 'Pre-carga de audios iniciada en segundo plano'
      });

    } catch (error) {
      console.error('❌ Preload Audios Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al iniciar la pre-carga de audios'
      });
    }
  };

  /**
   * Limpia el cache de audio
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  clearCache = async (req, res) => {
    try {
      this.studiesService.clearAudioCache();
      
      return res.json({
        success: true,
        message: 'Cache de audio limpiado exitosamente'
      });

    } catch (error) {
      console.error('❌ Clear Cache Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al limpiar el cache'
      });
    }
  };

  /**
   * Health check específico para el servicio de estudios
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  healthCheck = async (req, res) => {
    try {
      const questions = this.studiesService.getStudiesQuestions();
      const stats = this.studiesService.getCacheStats();
      
      const healthStatus = {
        timestamp: new Date().toISOString(),
        service: 'TirzepatidaStudiesService',
        status: 'healthy',
        totalQuestions: questions.length,
        cacheStats: stats
      };

      return res.json({
        success: true,
        health: healthStatus
      });

    } catch (error) {
      console.error('❌ Health Check Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error en el health check del servicio de estudios'
      });
    }
  };
}

// Export singleton instance
const tirzepatidaStudiesController = new TirzepatidaStudiesController();
export default tirzepatidaStudiesController;

