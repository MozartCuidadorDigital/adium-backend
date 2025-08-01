import totemService from './services/totemService.js';

async function testTextFormatting() {
  console.log('🧪 Testing Text Formatting\n');

  // Test the formatting function directly
  const testTexts = [
    'Mounjaro es un medicamento para diabetes tipo 2. Se administra por inyección. Los efectos secundarios incluyen náuseas y dolor de cabeza.',
    '¿Qué es Mounjaro? Es un medicamento que ayuda a controlar la diabetes. ¿Cómo se administra? Por inyección subcutánea.',
    'Contraindicaciones: No usar si tienes alergia. Efectos secundarios: náuseas, dolor de cabeza. Dosis: según prescripción médica.',
    'Mounjaro funciona de la siguiente manera: 1. Controla la glucosa. 2. Reduce el apetito. 3. Ayuda con la pérdida de peso.'
  ];

  console.log('📝 Testing text formatting:');
  console.log('=' .repeat(60));

  for (const text of testTexts) {
    console.log(`\n🔍 Original text:`);
    console.log(`"${text}"`);
    
    const formatted = totemService.formatTextResponse(text);
    console.log(`\n✅ Formatted text:`);
    console.log(`"${formatted}"`);
    console.log('\n' + '─'.repeat(40));
  }

  // Test with actual questions
  console.log('\n\n🧪 Testing with actual questions:');
  console.log('=' .repeat(60));

  const testQuestions = [
    '¿Qué es Mounjaro?',
    '¿Cuáles son los efectos secundarios?',
    '¿Cómo se administra?'
  ];

  for (const question of testQuestions) {
    console.log(`\n🎯 Testing question: "${question}"`);
    
    try {
      const result = await totemService.processQuestion(question);
      console.log(`   ✅ Success: ${result.success}`);
      console.log(`   📝 Formatted text:`);
      console.log(`   "${result.text}"`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n✅ Text formatting test completed!');
}

// Run the test
testTextFormatting().catch(console.error); 