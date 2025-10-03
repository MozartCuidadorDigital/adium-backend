import totemService from '../services/totemService.js';
import azureConfig from '../config/azure.js';

class TotemController {
  /**
   * Process a user question
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async processQuestion(req, res) {
    try {
      const { question, filter = "modulo eq 'mounjaro'" } = req.body;

      if (!question || question.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'La pregunta es requerida'
        });
      }

      console.log('📝 Totem Controller - Processing question:', question);

      const result = await totemService.processQuestion(question, filter);

      if (result.success) {
        return res.json({
          success: true,
          text: result.text,
          audioUrl: result.audioUrl,
          searchResults: result.searchResults,
          usage: result.usage,
          warning: result.warning
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error,
          text: result.text
        });
      }

    } catch (error) {
      console.error('❌ Totem Controller Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        text: 'Lo siento, ocurrió un error inesperado.'
      });
    }
  }

  /**
   * Get predefined questions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPredefinedQuestions(req, res) {
    try {
      const questions = totemService.getPredefinedQuestions();
      
      return res.json({
        success: true,
        questions: questions
      });

    } catch (error) {
      console.error('❌ Get Predefined Questions Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener las preguntas predefinidas'
      });
    }
  }

  /**
   * Get tirzepatida specific questions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTirzepatidaQuestions(req, res) {
    try {
      const questions = totemService.getTirzepatidaQuestions();
      
      return res.json({
        success: true,
        questions: questions
      });

    } catch (error) {
      console.error('❌ Get Tirzepatida Questions Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener las preguntas de tirzepatida'
      });
    }
  }

  /**
   * Process a predefined question by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async processPredefinedQuestion(req, res) {
    try {
      const { questionId } = req.params;

      if (!questionId) {
        return res.status(400).json({
          success: false,
          error: 'El ID de la pregunta es requerido'
        });
      }

      console.log('📝 Totem Controller - Processing predefined question ID:', questionId);

      // Get the predefined question
      const predefinedQuestion = totemService.getPredefinedQuestionById(questionId);
      
      if (!predefinedQuestion) {
        return res.status(404).json({
          success: false,
          error: 'Pregunta predefinida no encontrada'
        });
      }

      console.log('📋 Using predefined question:', predefinedQuestion.question);
      console.log('📋 Using specific prompt:', predefinedQuestion.prompt);

      // Process the question with the specific prompt
      const result = await totemService.processQuestion(
        predefinedQuestion.question, 
        "modulo eq 'mounjaro'", 
        predefinedQuestion.prompt
      );

      if (result.success) {
        return res.json({
          success: true,
          text: result.text,
          audioUrl: result.audioUrl,
          searchResults: result.searchResults,
          usage: result.usage,
          warning: result.warning,
          predefinedQuestion: {
            id: predefinedQuestion.id,
            text: predefinedQuestion.text,
            question: predefinedQuestion.question
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error,
          text: result.text
        });
      }

    } catch (error) {
      console.error('❌ Totem Controller Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        text: 'Lo siento, ocurrió un error inesperado.'
      });
    }
  }

  /**
   * Health check for totem services
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async healthCheck(req, res) {
    try {
      const configValidation = azureConfig.validateConfig();
      const serviceValidation = await totemService.validateServices();

      const healthStatus = {
        timestamp: new Date().toISOString(),
        config: configValidation,
        services: serviceValidation,
        overall: configValidation.isValid && Object.values(serviceValidation).every(Boolean)
      };

      const statusCode = healthStatus.overall ? 200 : 503;

      return res.status(statusCode).json({
        success: healthStatus.overall,
        health: healthStatus
      });

    } catch (error) {
      console.error('❌ Health Check Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error en el health check'
      });
    }
  }

  /**
   * Test endpoint for quick validation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async test(req, res) {
    try {
      const testQuestion = '¿Qué es Mounjaro?';
      console.log('🧪 Testing totem service with question:', testQuestion);

      const result = await totemService.processQuestion(testQuestion);

      return res.json({
        success: true,
        test: {
          question: testQuestion,
          result: result
        }
      });

    } catch (error) {
      console.error('❌ Test Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error en la prueba del servicio'
      });
    }
  }
}

// Export singleton instance
const totemController = new TotemController();
export default totemController; 