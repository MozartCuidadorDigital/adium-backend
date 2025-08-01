import azureOpenAIService from './azureOpenAIService.js';

class QueryValidationService {
  constructor() {
    this.openAIService = azureOpenAIService;
  }

  /**
   * Validate if a query is related to Mounjaro
   * @param {string} query - The user's query
   * @returns {Promise<Object>} - Validation result
   */
  async validateMounjaroQuery(query) {
    try {
      console.log('🔍 QueryValidationService - Validating query:', query);

      // Skip validation for greetings and help queries (they're handled separately)
      if (this.isGreeting(query) || this.isHelpQuery(query)) {
        console.log('✅ Greeting or help query detected, skipping validation');
        return {
          isValid: true,
          reason: 'Saludo o consulta de ayuda detectada',
          confidence: 'high'
        };
      }

      // Keywords that indicate Mounjaro-related queries
      const mounjaroKeywords = [
        'mounjaro', 'mounjaro', 'tirzepatide', 'tirzepatida',
        'diabetes', 'diabetes tipo 2', 'diabetes tipo 2',
        'glucosa', 'azúcar', 'insulina', 'metformina',
        'peso', 'obesidad', 'adelgazar', 'bajar de peso',
        'medicamento', 'medicina', 'tratamiento',
        'inyección', 'inyecciones', 'dosis',
        'efectos secundarios', 'contraindicaciones', 'interacciones',
        'seguridad', 'información', 'qué es', 'para qué sirve',
        'cómo funciona', 'cómo se usa', 'administración'
      ];

      // Implicit Mounjaro queries (when user asks about "it" or uses pronouns)
      const implicitQueries = [
        'qué es', 'qué es esto', 'qué es este medicamento',
        'para qué sirve', 'para qué se usa', 'cómo funciona',
        'cuáles son los efectos', 'efectos secundarios',
        'contraindicaciones', 'interacciones', 'dosis',
        'cómo se administra', 'cómo se usa', 'seguridad',
        'información', 'datos', 'detalles'
      ];

      const normalizedQuery = query.toLowerCase().trim();
      
      // Check for direct Mounjaro mentions
      const hasDirectMention = mounjaroKeywords.some(keyword => 
        normalizedQuery.includes(keyword.toLowerCase())
      );

      if (hasDirectMention) {
        console.log('✅ Direct Mounjaro-related keywords found');
        return {
          isValid: true,
          reason: 'Keywords relacionados con Mounjaro detectados',
          confidence: 'high'
        };
      }

      // Check for implicit queries (when user asks about "it" or uses general terms)
      const hasImplicitQuery = implicitQueries.some(implicit => 
        normalizedQuery.includes(implicit)
      );

      if (hasImplicitQuery) {
        console.log('✅ Implicit Mounjaro query detected');
        return {
          isValid: true,
          reason: 'Consulta implícita sobre Mounjaro detectada',
          confidence: 'high'
        };
      }

      // Check for context-based queries (when user asks about "this" or "it")
      const contextIndicators = ['esto', 'este', 'esta', 'este medicamento', 'esta medicina'];
      const hasContextIndicator = contextIndicators.some(indicator => 
        normalizedQuery.includes(indicator)
      );

      if (hasContextIndicator) {
        console.log('✅ Context-based query detected, assuming Mounjaro');
        return {
          isValid: true,
          reason: 'Consulta contextual detectada, asumiendo Mounjaro',
          confidence: 'medium'
        };
      }

      // For ambiguous queries, use AI to determine if it's related to Mounjaro
      const validationPrompt = `Analiza la siguiente pregunta y determina si está relacionada con Mounjaro (tirzepatide), diabetes tipo 2, control de peso, o información médica relacionada.

Pregunta: "${query}"

Responde únicamente con "SÍ" si la pregunta está relacionada con Mounjaro, diabetes, peso, o información médica relevante, o "NO" si no está relacionada.

Considera que Mounjaro es un medicamento para diabetes tipo 2 y control de peso.`;

      const aiValidation = await this.openAIService.generateResponse(validationPrompt);
      
      if (!aiValidation.success) {
        console.error('❌ AI validation failed:', aiValidation.error);
        // If AI validation fails, be conservative and allow the query
        return {
          isValid: true,
          reason: 'Validación AI falló, permitiendo consulta por seguridad',
          confidence: 'low'
        };
      }

      const aiResponse = aiValidation.response.toLowerCase().trim();
      const isRelated = aiResponse.includes('sí') || aiResponse.includes('si');

      console.log('🤖 AI validation result:', aiResponse, 'Is related:', isRelated);

      return {
        isValid: isRelated,
        reason: isRelated ? 'AI determinó que está relacionado con Mounjaro' : 'AI determinó que no está relacionado con Mounjaro',
        confidence: 'medium'
      };

    } catch (error) {
      console.error('❌ QueryValidationService Error:', error);
      // In case of error, be conservative and allow the query
      return {
        isValid: true,
        reason: 'Error en validación, permitiendo consulta por seguridad',
        confidence: 'low'
      };
    }
  }

  /**
   * Get a friendly message for non-Mounjaro queries
   * @param {string} query - The original query
   * @returns {string} - Friendly rejection message
   */
  getRejectionMessage(query) {
    const messages = [
      'Lo siento, solo puedo responder preguntas relacionadas con Mounjaro y diabetes tipo 2. ¿Hay algo específico sobre Mounjaro que te gustaría saber?',
      'Mi especialidad es Mounjaro y diabetes tipo 2. ¿Tienes alguna pregunta sobre este medicamento?',
      'Solo puedo ayudarte con información sobre Mounjaro. ¿Te gustaría saber qué es Mounjaro o para qué se usa?',
      'Mi conocimiento se centra en Mounjaro. ¿Hay algo específico sobre este medicamento que te interesa?'
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Check if query is a simple greeting
   * @param {string} query - The user's query
   * @returns {boolean} - Whether it's a greeting
   */
  isGreeting(query) {
    const greetings = [
      'hola', 'hello', 'hi', 'buenos días', 'buenas tardes', 
      'buenas noches', 'saludos', 'hey', 'qué tal', 'cómo estás'
    ];
    
    const normalizedQuery = query.toLowerCase().trim();
    return greetings.some(greeting => normalizedQuery.includes(greeting));
  }

  /**
   * Check if query is asking for help or what the system can do
   * @param {string} query - The user's query
   * @returns {boolean} - Whether it's asking for help
   */
  isHelpQuery(query) {
    const helpKeywords = [
      'ayuda', 'help', 'qué puedes hacer', 'qué sabes', 
      'qué información tienes', 'cómo funciona', 'para qué sirves',
      'qué haces', 'qué puedes', 'información', 'datos'
    ];
    
    const normalizedQuery = query.toLowerCase().trim();
    return helpKeywords.some(keyword => normalizedQuery.includes(keyword));
  }
}

// Export singleton instance
const queryValidationService = new QueryValidationService();
export default queryValidationService; 