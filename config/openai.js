import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

class OpenAIConfig {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Usar configuración simple y confiable
    this.model = 'gpt-3.5-turbo';
    this.maxTokens = 100;
    this.temperature = 0.7;
  }

  /**
   * Generate a response using OpenAI with optimized settings for voice
   * @param {string} userMessage - The user's message
   * @param {Array} conversationHistory - Previous conversation messages
   * @returns {Promise<string>} - The AI response
   */
  async generateResponse(userMessage, conversationHistory = []) {
    try {
      console.log('🔍 OpenAI Config - Model:', this.model, 'MaxTokens:', this.maxTokens);
      console.log('🔍 OpenAI Config - API Key exists:', !!process.env.OPENAI_API_KEY);
      
      // Usar exactamente la misma configuración que funciona
      const messages = [
        { role: 'system', content: 'Eres un asistente de voz amigable. Responde en español de manera natural.' },
        { role: 'user', content: userMessage }
      ];

      console.log('📤 Enviando request a OpenAI con', messages.length, 'mensajes');
      
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature
      });

      const response = completion.choices[0].message.content;
      console.log('📥 Respuesta recibida de OpenAI:', response);
      
      return response;
    } catch (error) {
      console.error('❌ Error generating OpenAI response:', error);
      console.error('❌ Error details:', error.message);
      throw new Error('Failed to generate response');
    }
  }

  /**
   * Validate API key
   * @returns {Promise<boolean>} - Whether the API key is valid
   */
  async validateApiKey() {
    try {
      await this.openai.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI API key validation failed:', error);
      return false;
    }
  }

  /**
   * Get available models
   * @returns {Promise<Array>} - List of available models
   */
  async getAvailableModels() {
    try {
      const models = await this.openai.models.list();
      return models.data.map(model => model.id);
    } catch (error) {
      console.error('Error fetching OpenAI models:', error);
      return [];
    }
  }
}

// Export singleton instance
const openAIConfig = new OpenAIConfig();
export default openAIConfig; 