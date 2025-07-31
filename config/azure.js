import dotenv from 'dotenv';

dotenv.config();

class AzureConfig {
  constructor() {
    // Azure OpenAI Configuration
    this.azureOpenAI = {
      endpoint: 'https://uyza-openai-iadium-dev-eastus2.openai.azure.com',
      deployment: 'gpt-4.1-mini',
      apiVersion: '2025-01-01-preview',
      apiKey: process.env.AZURE_OPENAI_API_KEY
    };

    // Azure Search Configuration
    this.azureSearch = {
      endpoint: 'https://uyza-srch-iadium-dev001.search.windows.net',
      indexName: 'iadium-knowledge',
      apiVersion: '2023-07-01-Preview',
      apiKey: process.env.AZURE_SEARCH_API_KEY
    };

    // ElevenLabs Configuration (mantenemos el existente)
    this.elevenLabs = {
      apiKey: process.env.ELEVENLABS_API_KEY,
      voiceId: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',
      modelId: process.env.ELEVENLABS_MODEL_ID || 'eleven_monolingual_v1'
    };
  }

  /**
   * Validate all required API keys
   * @returns {Object} - Validation results
   */
  validateConfig() {
    const results = {
      azureOpenAI: !!this.azureOpenAI.apiKey,
      azureSearch: !!this.azureSearch.apiKey,
      elevenLabs: !!this.elevenLabs.apiKey
    };

    const allValid = Object.values(results).every(Boolean);
    
    console.log('🔍 Azure Config Validation:', results);
    
    return {
      isValid: allValid,
      details: results
    };
  }

  /**
   * Get Azure OpenAI URL
   * @returns {string} - Complete URL for Azure OpenAI
   */
  getAzureOpenAIUrl() {
    return `${this.azureOpenAI.endpoint}/openai/deployments/${this.azureOpenAI.deployment}/chat/completions?api-version=${this.azureOpenAI.apiVersion}`;
  }

  /**
   * Get Azure Search URL
   * @returns {string} - Complete URL for Azure Search
   */
  getAzureSearchUrl() {
    return `${this.azureSearch.endpoint}/indexes/${this.azureSearch.indexName}/docs/search?api-version=${this.azureSearch.apiVersion}`;
  }
}

// Export singleton instance
const azureConfig = new AzureConfig();
export default azureConfig; 