import totemService from './services/totemService.js';

async function testGreeting() {
  console.log('🧪 Testing Greeting Functionality\n');

  const greetingTests = [
    'hola',
    'hello',
    'hi',
    'buenos días',
    'buenas tardes',
    'saludos'
  ];

  for (const greeting of greetingTests) {
    console.log(`\n👋 Testing greeting: "${greeting}"`);
    
    try {
      const result = await totemService.processQuestion(greeting);
      console.log(`   ✅ Success: ${result.success}`);
      console.log(`   📝 Text: ${result.text}`);
      console.log(`   🔍 Validation: ${result.validation?.isValid ? 'Valid' : 'Invalid'}`);
      console.log(`   🎯 Reason: ${result.validation?.reason}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n✅ Greeting test completed!');
}

// Run the test
testGreeting().catch(console.error); 