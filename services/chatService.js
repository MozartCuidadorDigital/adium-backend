import openAIConfig from '../config/openai.js';

class ChatService {
  constructor() {
    this.conversationHistory = [];
    this.maxHistoryLength = 20; // Keep last 20 messages
  }

  /**
   * Generate AI response with optimized settings for faster response
   * @param {string} userMessage - User's message
   * @param {Array} customHistory - Custom conversation history
   * @returns {Promise<string>} - AI response
   */
  async generateResponse(userMessage, customHistory = null) {
    try {
      if (!userMessage || userMessage.trim().length === 0) {
        throw new Error('User message cannot be empty');
      }

      const history = customHistory || this.conversationHistory;
      
      console.log('Generating AI response for:', userMessage);

      const response = await openAIConfig.generateResponse(userMessage, history);

      console.log('AI response generated:', response);

      // Add to conversation history
      this.addToHistory(userMessage, response);

      return response;

    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }

  /**
   * Add message to conversation history
   * @param {string} userMessage - User message
   * @param {string} assistantResponse - Assistant response
   */
  addToHistory(userMessage, assistantResponse) {
    this.conversationHistory.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantResponse }
    );

    // Keep only the last maxHistoryLength messages
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }
  }

  /**
   * Get current conversation history
   * @returns {Array} - Conversation history
   */
  getHistory() {
    return [...this.conversationHistory];
  }

  /**
   * Set conversation history
   * @param {Array} history - New conversation history
   */
  setHistory(history) {
    this.conversationHistory = [...history];
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Get conversation summary
   * @returns {Object} - Summary of conversation
   */
  getConversationSummary() {
    return {
      messageCount: this.conversationHistory.length,
      userMessages: this.conversationHistory.filter(msg => msg.role === 'user').length,
      assistantMessages: this.conversationHistory.filter(msg => msg.role === 'assistant').length,
      lastMessage: this.conversationHistory.length > 0 ? this.conversationHistory[this.conversationHistory.length - 1] : null
    };
  }

  /**
   * Validate if the conversation is still within context limits
   * @returns {boolean} - Whether conversation is within limits
   */
  isWithinContextLimits() {
    // Estimate tokens (rough calculation: 1 token ≈ 4 characters)
    const totalCharacters = this.conversationHistory.reduce((total, msg) => {
      return total + msg.content.length;
    }, 0);
    
    const estimatedTokens = Math.ceil(totalCharacters / 4);
    const maxTokens = 4000; // Conservative limit
    
    return estimatedTokens < maxTokens;
  }

  /**
   * Truncate history if it exceeds context limits
   */
  truncateHistoryIfNeeded() {
    if (!this.isWithinContextLimits()) {
      // Remove oldest messages while keeping system message context
      const systemMessages = this.conversationHistory.filter(msg => msg.role === 'system');
      const nonSystemMessages = this.conversationHistory.filter(msg => msg.role !== 'system');
      
      // Keep only the most recent messages
      const maxNonSystemMessages = Math.floor(this.maxHistoryLength / 2);
      const truncatedNonSystem = nonSystemMessages.slice(-maxNonSystemMessages);
      
      this.conversationHistory = [...systemMessages, ...truncatedNonSystem];
    }
  }

  /**
   * Get conversation context for API calls
   * @returns {Array} - Formatted conversation history for API
   */
  getConversationContext() {
    return this.conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Check if conversation is empty
   * @returns {boolean} - Whether conversation is empty
   */
  isEmpty() {
    return this.conversationHistory.length === 0;
  }

  /**
   * Get the last user message
   * @returns {string|null} - Last user message or null
   */
  getLastUserMessage() {
    const userMessages = this.conversationHistory.filter(msg => msg.role === 'user');
    return userMessages.length > 0 ? userMessages[userMessages.length - 1].content : null;
  }

  /**
   * Get the last assistant message
   * @returns {string|null} - Last assistant message or null
   */
  getLastAssistantMessage() {
    const assistantMessages = this.conversationHistory.filter(msg => msg.role === 'assistant');
    return assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1].content : null;
  }
}

export default ChatService; 