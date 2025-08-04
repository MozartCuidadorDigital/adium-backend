import azureSearchService from './azureSearchService.js';
import azureOpenAIService from './azureOpenAIService.js';
import TTSService from './ttsService.js';
import queryValidationService from './queryValidationService.js';

class TotemService {
  constructor() {
    this.searchService = azureSearchService;
    this.openAIService = azureOpenAIService;
    this.ttsService = new TTSService();
    this.queryValidationService = queryValidationService;
  }

  /**
   * Format text response for better readability in frontend
   * @param {string} text - Raw text from OpenAI
   * @returns {string} - Formatted text with proper structure
   */
  formatTextResponse(text) {
    if (!text) return text;

    let formattedText = text;

    // Add line breaks after periods that end sentences
    formattedText = formattedText.replace(/\.\s+/g, '.\n\n');
    
    // Add line breaks after question marks
    formattedText = formattedText.replace(/\?\s+/g, '?\n\n');
    
    // Add line breaks after exclamation marks
    formattedText = formattedText.replace(/!\s+/g, '!\n\n');
    
    // Add line breaks after colons
    formattedText = formattedText.replace(/:\s+/g, ':\n\n');
    
    // Add line breaks after semicolons
    formattedText = formattedText.replace(/;\s+/g, ';\n\n');
    
    // Format lists (lines that start with - or •)
    formattedText = formattedText.replace(/^\s*[-•]\s+/gm, '\n• ');
    
    // Format numbered lists
    formattedText = formattedText.replace(/^\s*(\d+)\.\s+/gm, '\n$1. ');
    
    // Add spacing around important keywords
    const keywords = ['Mounjaro', 'diabetes', 'efectos secundarios', 'contraindicaciones', 'dosis', 'administración'];
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formattedText = formattedText.replace(regex, `**${keyword}**`);
    });
    
    // Clean up excessive line breaks
    formattedText = formattedText.replace(/\n{3,}/g, '\n\n');
    
    // Remove leading/trailing whitespace
    formattedText = formattedText.trim();
    
    return formattedText;
  }

  /**
   * Process a user question through the complete totem flow
   * @param {string} userQuestion - The user's question
   * @param {string} filter - Optional filter for search (default: mounjaro)
   * @param {string} specificPrompt - Optional specific prompt to use instead of the general one
   * @returns {Promise<Object>} - Complete response with text and audio
   */
  async processQuestion(userQuestion, filter = "modulo eq 'mounjaro'", specificPrompt = null) {
    try {
      console.log('🎯 Totem Service - Processing question:', userQuestion);
      
      // Check for greeting messages
      const normalizedQuestion = userQuestion.toLowerCase().trim();
      if (this.queryValidationService.isGreeting(normalizedQuestion)) {
        const greetingResponse = 'Hola, soy tu asistente especializado en Mounjaro. ¿En qué puedo ayudarte hoy?';
        console.log('👋 Greeting detected, returning Mounjaro-focused response');
        
        // Generate audio for greeting
        const audioResult = await this.ttsService.generateSpeechUrl(greetingResponse);
        
        return {
          success: true,
          text: this.formatTextResponse(greetingResponse),
          audioUrl: audioResult.success ? audioResult.audioUrl : null,
          searchResults: 0,
          usage: null
        };
      }

      // Check if this question matches a predefined question
      const predefinedQuestions = this.getPredefinedQuestions();
      let matchedPredefinedQuestion = null;
      
      for (const predefined of predefinedQuestions) {
        // Check for exact match with the question field (what frontend sends)
        if (userQuestion.toLowerCase().trim() === predefined.question.toLowerCase().trim()) {
          matchedPredefinedQuestion = predefined;
          break;
        }
      }

      // If we found a match and no specific prompt was provided, use the predefined prompt
      if (matchedPredefinedQuestion && !specificPrompt) {
        specificPrompt = matchedPredefinedQuestion.prompt;
        console.log(`🎯 Matched predefined question: ${matchedPredefinedQuestion.id}`);
        console.log(`📝 Using specific prompt for: ${matchedPredefinedQuestion.text}`);
      }
      
      // Step 1: Search for relevant information
      console.log('🔍 Step 1: Searching for relevant information...');
      const searchResults = await this.searchService.searchKnowledge(userQuestion, filter, 5); // Aumentado de 3 a 5
      
      if (!searchResults.success) {
        console.error('❌ Search failed:', searchResults.error);
        return {
          success: false,
          error: 'Error en la búsqueda de información',
          text: 'Lo siento, no pude buscar información relevante en este momento.',
          audioUrl: null
        };
      }

      // Step 2: Extract relevant text from search results
      console.log('📝 Step 2: Extracting relevant text...');
      const relevantText = this.searchService.extractRelevantText(searchResults.results);
      
      // Step 3: Generate AI response with context
      console.log('🤖 Step 3: Generating AI response...');
      const aiResponse = await this.openAIService.generateResponse(userQuestion, relevantText, specificPrompt);
      
      if (!aiResponse.success) {
        console.error('❌ AI response failed:', aiResponse.error);
        return {
          success: false,
          error: 'Error en la generación de respuesta',
          text: 'Lo siento, no pude generar una respuesta en este momento.',
          audioUrl: null
        };
      }

      // Step 4: Generate audio from the response (use original text for TTS)
      const ttsText = aiResponse.response; // Use original text for audio
      console.log('📝 TTS text length:', ttsText.length, 'characters');
      console.log('📝 TTS text preview:', ttsText.substring(0, 100) + '...');
      
      const audioResult = await this.ttsService.generateSpeechUrl(ttsText);
      
      if (!audioResult.success) {
        console.error('❌ Audio generation failed:', audioResult.error);
        return {
          success: true, // Still return text even if audio fails
          text: this.formatTextResponse(aiResponse.response), // Format text for frontend
          audioUrl: null,
          warning: 'Respuesta generada pero no se pudo crear el audio.'
        };
      }

      console.log('✅ Totem Service - Complete response generated');
      
      return {
        success: true,
        text: this.formatTextResponse(aiResponse.response), // Format text for frontend
        audioUrl: audioResult.audioUrl,
        searchResults: searchResults.results.length,
        usage: aiResponse.usage
      };

    } catch (error) {
      console.error('❌ Totem Service Error:', error);
      return {
        success: false,
        error: 'Error interno del sistema',
        text: 'Lo siento, ocurrió un error inesperado. Por favor, intenta de nuevo.',
        audioUrl: null
      };
    }
  }

  /**
   * Get predefined questions for the totem interface
   * @returns {Array} - List of predefined questions
   */
   getPredefinedQuestions() {
    return [
      {
        id: 'que-es-mounjaro',
        text: '¿Qué es Mounjaro?',
        question: '¿Qué es Mounjaro?',
        prompt: 'Explica en qué consiste el medicamento Mounjaro, incluyendo su principio activo, indicaciones terapéuticas, mecanismo de acción y condiciones médicas para las cuales está aprobado. Menciona si está indicado para diabetes tipo 2, control de peso u otras condiciones. Usa información médica actualizada y validada.'
      },
      {
        id: 'que-es-tirzepatida',
        text: '¿Qué es Tirzepatida?',
        question: '¿Qué es Tirzepatida?',
        prompt: 'Describe qué es la Tirzepatida, incluyendo su clasificación farmacológica, cómo actúa en el organismo, y en qué condiciones médicas se utiliza.'
      },
      {
        id: 'que-son-incretinas',
        text: 'Incretinas',
        question: '¿Qué son las incretinas?',
        prompt: 'Define qué son las incretinas, cuáles son las principales (GLP-1 y GIP), cómo actúan en el cuerpo humano, y qué rol tienen en el control de la glucemia y en el tratamiento de la diabetes tipo 2. Explica cómo se relacionan con medicamentos como la Tirzepatida.'
      },
      {
        id: 'que-es-gip',
        text: '¿Qué es el GIP?',
        question: '¿Qué es el GIP?',
        prompt: 'Explica qué es el péptido insulinotrópico dependiente de glucosa (GIP), cómo se produce en el organismo, cuál es su función en la regulación del azúcar en sangre, y cómo interactúa con otros receptores como el GLP-1. Describe su relevancia en tratamientos como el uso de Tirzepatida.'
      },
      {
        id: 'programa-surpass',
        text: 'Programa SURPASS',
        question: '¿Qué es el programa Surpass?',
        prompt: 'Describe en qué consiste el programa clínico SURPASS, cuáles fueron sus objetivos, en qué fases se realizó, qué población fue evaluada y cuáles fueron los resultados principales en términos de control glucémico y seguridad con Tirzepatida o Mounjaro.'
      },
      {
        id: 'programa-surmount',
        text: 'Programa SURMOUNT',
        question: '¿Qué es el programa Surmount?',
        prompt: 'Explica qué es el programa clínico SURMOUNT, cuál fue su enfoque principal (control de peso), cómo se diseñó el estudio, qué resultados obtuvo respecto a la pérdida de peso con Tirzepatida y cuál es su impacto clínico actual.'
      },
      {
        id: 'tirzepatida-vs-semaglutida',
        text: 'Comparación con Semaglutida',
        question: '¿Tirzepatida vs Semaglutida?',
        prompt: 'Compara la Tirzepatida y la Semaglutida en cuanto a eficacia, mecanismos de acción, control glucémico, reducción de peso, seguridad y efectos adversos. Usa datos clínicos de estudios relevantes como SURPASS y SUSTAIN.'
      },
      {
        id: 'resultados-diabetes',
        text: 'Resultados en Diabetes',
        question: 'Resultados en Diabetes',
        prompt: 'Resume los principales resultados clínicos de Mounjaro (Tirzepatida) en pacientes con diabetes tipo 2. Incluye mejoras en HbA1c, reducción de glucosa en sangre, pérdida de peso asociada y comparación frente a otros tratamientos como insulina o agonistas GLP-1.'
      },
      {
        id: 'resultados-peso',
        text: 'Resultados en Peso',
        question: 'Resultados en Baja de Peso',
        prompt: 'Describe los resultados obtenidos en estudios clínicos con Tirzepatida para la reducción de peso en pacientes con o sin diabetes. Menciona porcentajes de pérdida de peso, duración del tratamiento, y comparaciones con otros medicamentos disponibles.'
      },
      {
        id: 'indicaciones-mounjaro',
        text: 'Indicaciones Médicas',
        question: 'Indicaciones de Mounjaro',
        prompt: 'Detalla las indicaciones aprobadas oficialmente para el uso de Mounjaro, incluyendo su uso en diabetes tipo 2 y/o tratamiento para la obesidad. Menciona qué organismos reguladores han aprobado su uso (FDA, EMA, etc.) y bajo qué condiciones debe prescribirse.'
      }
    ];
  }

  /**
   * Get a specific predefined question by ID
   * @param {string} questionId - The ID of the predefined question
   * @returns {Object|null} - The predefined question or null if not found
   */
  getPredefinedQuestionById(questionId) {
    const questions = this.getPredefinedQuestions();
    return questions.find(q => q.id === questionId) || null;
  }

  /**
   * Validate all services are working
   * @returns {Promise<Object>} - Validation results
   */
  async validateServices() {
    const results = {
      search: false,
      openai: false,
      tts: false
    };

    try {
      // Test search service
      const searchTest = await this.searchService.searchKnowledge('test', "modulo eq 'mounjaro'", 1);
      results.search = searchTest.success;

      // Test OpenAI service
      const openaiTest = await this.openAIService.generateResponse('test');
      results.openai = openaiTest.success;

      // Test TTS service
      const ttsTest = await this.ttsService.generateSpeechUrl('Test de síntesis de voz.');
      results.tts = ttsTest.success;

    } catch (error) {
      console.error('❌ Service validation error:', error);
    }

    return results;
  }
}

// Export singleton instance
const totemService = new TotemService();
export default totemService; 