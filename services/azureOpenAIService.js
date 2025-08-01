import azureConfig from '../config/azure.js';

class AzureOpenAIService {
  constructor() {
    this.config = azureConfig;
  }

  /**
   * Generate a response using Azure OpenAI
   * @param {string} userMessage - The user's message
   * @param {string} context - Additional context from search results
   * @param {string} specificPrompt - Optional specific prompt to use instead of the general one
   * @returns {Promise<Object>} - OpenAI response
   */
  async generateResponse(userMessage, context = '', specificPrompt = null) {
    try {
      console.log('🤖 Azure OpenAI - User Message:', userMessage);
      console.log('🤖 Azure OpenAI - Context Length:', context.length);
      console.log('🤖 Azure OpenAI - Using specific prompt:', !!specificPrompt);

      // Prepare the system message with context
      let systemMessage = specificPrompt || `Eres un asistente especializado en Mounjaro (tirzepatide). Tu función es responder cualquier pregunta que te hagan basándote en la información de Mounjaro disponible.

IMPORTANTE: Cualquier pregunta que recibas, sin importar si menciona Mounjaro o no, debes responderla basándote en la información de Mounjaro que tienes disponible. Si la pregunta no está relacionada con Mounjaro, responde amablemente redirigiendo al usuario hacia información sobre Mounjaro.

Responde de manera clara y precisa en español.`;
      
      if (context && context.trim().length > 0) {
        systemMessage += `\n\nInformación de referencia sobre Mounjaro: ${context}`;
      }

      const requestBody = {
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 500
      };

      console.log('📤 Enviando request a Azure OpenAI');

      const response = await fetch(this.config.getAzureOpenAIUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.azureOpenAI.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Azure OpenAI');
      }

      const aiResponse = data.choices[0].message.content;
      
      console.log('📥 Respuesta recibida de Azure OpenAI:', aiResponse.substring(0, 100) + '...');
      
      return {
        success: true,
        response: aiResponse,
        usage: data.usage || null
      };

    } catch (error) {
      console.error('❌ Azure OpenAI Error:', error);
      return {
        success: false,
        error: error.message,
        response: 'Lo siento, no pude procesar tu consulta en este momento. Por favor, intenta de nuevo.'
      };
    }
  }

  /**
   * Validate Azure OpenAI configuration
   * @returns {Promise<boolean>} - Whether the configuration is valid
   */
  async validateConfig() {
    try {
      const testResponse = await this.generateResponse('Hola, ¿cómo estás?');
      return testResponse.success;
    } catch (error) {
      console.error('❌ Azure OpenAI Config Validation Failed:', error);
      return false;
    }
  }
}

// Export singleton instance
const azureOpenAIService = new AzureOpenAIService();
export default azureOpenAIService; 