import azureConfig from '../config/azure.js';

class AzureSearchService {
  constructor() {
    this.config = azureConfig;
  }

  /**
   * Search for relevant information in Azure Search
   * @param {string} query - The search query
   * @param {string} filter - The filter to apply (e.g., "modulo eq 'mounjaro'")
   * @param {number} top - Number of results to return
   * @returns {Promise<Object>} - Search results
   */
  async searchKnowledge(query, filter = "modulo eq 'mounjaro'", top = 3) {
    try {
      console.log('🔍 Azure Search - Query:', query);
      console.log('🔍 Azure Search - Filter:', filter);
      console.log('🔍 Azure Search - Top:', top);

      const searchBody = {
        search: query,
        filter: filter,
        top: top
      };

      const response = await fetch(this.config.getAzureSearchUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.azureSearch.apiKey
        },
        body: JSON.stringify(searchBody)
      });

      if (!response.ok) {
        throw new Error(`Azure Search API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Extract and clean the relevant information
      const cleanedResults = this.cleanSearchResults(data);
      
      console.log('📥 Azure Search - Results found:', cleanedResults.length);
      
      return {
        success: true,
        results: cleanedResults,
        rawData: data
      };

    } catch (error) {
      console.error('❌ Azure Search Error:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Clean and extract relevant information from search results
   * @param {Object} searchData - Raw search data from Azure
   * @returns {Array} - Cleaned results
   */
  cleanSearchResults(searchData) {
    if (!searchData.value || !Array.isArray(searchData.value)) {
      return [];
    }

    return searchData.value.map(item => ({
      score: item['@search.score'],
      chunk: item.chunk,
      title: item.title,
      chunkId: item.chunk_id,
      parentId: item.parent_id
    })).filter(item => item.chunk && item.chunk.trim().length > 0);
  }

  /**
   * Extract the most relevant text from search results
   * @param {Array} results - Cleaned search results
   * @returns {string} - Combined relevant text
   */
  extractRelevantText(results) {
    if (!results || results.length === 0) {
      return 'No se encontró información relevante sobre tu consulta.';
    }

    // Sort by score and take the top results
    const topResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, 2); // Take top 2 results

    // Combine the chunks and clean them
    let combinedText = topResults
      .map(item => item.chunk)
      .join('\n\n');

    // Clean up the text
    combinedText = this.cleanText(combinedText);

    return combinedText;
  }

  /**
   * Clean text by removing unnecessary formatting and noise
   * @param {string} text - Raw text to clean
   * @returns {string} - Cleaned text
   */
  cleanText(text) {
    if (!text) return '';

    return text
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that might be noise
      .replace(/[^\w\s\.\,\;\:\!\?\-\(\)]/g, '')
      // Trim whitespace
      .trim();
  }
}

// Export singleton instance
const azureSearchService = new AzureSearchService();
export default azureSearchService; 