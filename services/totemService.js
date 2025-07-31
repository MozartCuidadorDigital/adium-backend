import azureSearchService from './azureSearchService.js';
import azureOpenAIService from './azureOpenAIService.js';
import TTSService from './ttsService.js';

class TotemService {
  constructor() {
    this.searchService = azureSearchService;
    this.openAIService = azureOpenAIService;
    this.ttsService = new TTSService();
  }

  /**
   * Process a user question through the complete totem flow
   * @param {string} userQuestion - The user's question
   * @param {string} filter - Optional filter for search (default: mounjaro)
   * @returns {Promise<Object>} - Complete response with text and audio
   */
  async processQuestion(userQuestion, filter = "modulo eq 'mounjaro'") {
    try {
      console.log('🎯 Totem Service - Processing question:', userQuestion);
      
      // Check for greeting messages
      const normalizedQuestion = userQuestion.toLowerCase().trim();
      if (normalizedQuestion === 'hola' || normalizedQuestion === 'hello' || normalizedQuestion === 'hi') {
        const greetingResponse = 'Hola, ¿en qué puedo ayudarte hoy?';
        console.log('👋 Greeting detected, returning standard response');
        
        // Generate audio for greeting
        const audioResult = await this.ttsService.generateSpeechUrl(greetingResponse);
        
        return {
          success: true,
          text: greetingResponse,
          audioUrl: audioResult.success ? audioResult.audioUrl : null,
          searchResults: 0,
          usage: null
        };
      }
      
      // Step 1: Search for relevant information
      console.log('🔍 Step 1: Searching for relevant information...');
      const searchResults = await this.searchService.searchKnowledge(userQuestion, filter, 3);
      
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
      const aiResponse = await this.openAIService.generateResponse(userQuestion, relevantText);
      
      if (!aiResponse.success) {
        console.error('❌ AI response failed:', aiResponse.error);
        return {
          success: false,
          error: 'Error en la generación de respuesta',
          text: 'Lo siento, no pude generar una respuesta en este momento.',
          audioUrl: null
        };
      }

      // Step 4: Generate audio from the response
      
      // Use the complete response for TTS - no truncation
      const ttsText = aiResponse.response;
      console.log('📝 TTS text length:', ttsText.length, 'characters');
      console.log('📝 TTS text preview:', ttsText.substring(0, 100) + '...');
      
      const audioResult = await this.ttsService.generateSpeechUrl(ttsText);
      
      if (!audioResult.success) {
        console.error('❌ Audio generation failed:', audioResult.error);
        return {
          success: true, // Still return text even if audio fails
          text: aiResponse.response,
          audioUrl: null,
          warning: 'Respuesta generada pero no se pudo crear el audio.'
        };
      }

      console.log('✅ Totem Service - Complete response generated');
      
      return {
        success: true,
        text: aiResponse.response,
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
        id: 'info',
        text: 'Información sobre Mounjaro',
        question: '¿Qué es Mounjaro y para qué se usa?'
      },
      {
        id: 'effects',
        text: 'Efectos secundarios',
        question: '¿Cuáles son los efectos secundarios de Mounjaro?'
      },
      {
        id: 'dosage',
        text: 'Dosis y administración',
        question: '¿Cómo se administra Mounjaro y cuál es la dosis recomendada?'
      },
      {
        id: 'safety',
        text: 'Información de seguridad',
        question: '¿Qué información de seguridad debo conocer sobre Mounjaro?'
      },
      {
        id: 'interactions',
        text: 'Interacciones medicamentosas',
        question: '¿Qué medicamentos pueden interactuar con Mounjaro?'
      }
    ];
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