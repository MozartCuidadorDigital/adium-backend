import totemService from './services/totemService.js';
import queryValidationService from './services/queryValidationService.js';

async function testQueryValidation() {
  console.log('🧪 Testing Query Validation System\n');

  const testQueries = [
    // Queries that should be accepted (Mounjaro-related)
    '¿Qué es Mounjaro?',
    '¿Qué es?',
    '¿Para qué sirve?',
    '¿Cuáles son las contraindicaciones?',
    '¿Qué efectos secundarios tiene?',
    '¿Cómo se administra?',
    '¿Cuál es la dosis?',
    '¿Qué interacciones tiene?',
    'Información sobre diabetes',
    '¿Cómo funciona este medicamento?',
    '¿Qué es esto?',
    '¿Para qué sirve este medicamento?',
    
    // Queries that should be rejected (not Mounjaro-related)
    '¿Cuál es la capital de Francia?',
    '¿Cómo cocinar pasta?',
    '¿Qué tiempo hace hoy?',
    '¿Cuál es el precio del dólar?',
    '¿Cómo llegar al centro comercial?',
    '¿Qué películas están en cartelera?',
    '¿Cuál es mi horóscopo?',
    '¿Cómo reparar mi computadora?'
  ];

  console.log('📋 Testing individual query validation:');
  console.log('=' .repeat(60));

  for (const query of testQueries) {
    console.log(`\n🔍 Testing: "${query}"`);
    
    try {
      const validation = await queryValidationService.validateMounjaroQuery(query);
      console.log(`   ✅ Valid: ${validation.isValid}`);
      console.log(`   📝 Reason: ${validation.reason}`);
      console.log(`   🎯 Confidence: ${validation.confidence}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n\n🧪 Testing full totem service flow:');
  console.log('=' .repeat(60));

  const flowTestQueries = [
    '¿Qué es Mounjaro?',
    '¿Qué es?',
    '¿Cuáles son las contraindicaciones?',
    '¿Cómo cocinar pasta?', // This should be rejected
    '¿Qué efectos secundarios tiene?'
  ];

  for (const query of flowTestQueries) {
    console.log(`\n🎯 Testing full flow: "${query}"`);
    
    try {
      const result = await totemService.processQuestion(query);
      console.log(`   ✅ Success: ${result.success}`);
      console.log(`   📝 Text: ${result.text.substring(0, 100)}...`);
      console.log(`   🔍 Validation: ${result.validation?.isValid ? 'Valid' : 'Invalid'}`);
      console.log(`   🎯 Confidence: ${result.validation?.confidence}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n✅ Query validation testing completed!');
}

// Run the test
testQueryValidation().catch(console.error); 