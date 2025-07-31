import totemService from './services/totemService.js';
import azureConfig from './config/azure.js';

async function testTotemSystem() {
  console.log('🧪 Testing Totem System...\n');

  // Test 1: Configuration validation
  console.log('1️⃣ Testing configuration...');
  const configValidation = azureConfig.validateConfig();
  console.log('Configuration validation:', configValidation);
  console.log('');

  // Test 2: Service validation
  console.log('2️⃣ Testing services...');
  const serviceValidation = await totemService.validateServices();
  console.log('Service validation:', serviceValidation);
  console.log('');

  // Test 3: Predefined questions
  console.log('3️⃣ Testing predefined questions...');
  const questions = totemService.getPredefinedQuestions();
  console.log('Predefined questions:', questions.length);
  questions.forEach((q, i) => {
    console.log(`   ${i + 1}. ${q.text}: ${q.question}`);
  });
  console.log('');

  // Test 4: Full question processing (only if config is valid)
  if (configValidation.isValid) {
    console.log('4️⃣ Testing full question processing...');
    const testQuestion = '¿Qué es Mounjaro?';
    console.log(`Processing question: "${testQuestion}"`);
    
    const result = await totemService.processQuestion(testQuestion);
    
    if (result.success) {
      console.log('✅ Success!');
      console.log(`Text response: ${result.text.substring(0, 100)}...`);
      console.log(`Audio URL: ${result.audioUrl || 'None'}`);
      console.log(`Search results found: ${result.searchResults}`);
    } else {
      console.log('❌ Failed!');
      console.log(`Error: ${result.error}`);
      console.log(`Text: ${result.text}`);
    }
  } else {
    console.log('4️⃣ Skipping full test due to invalid configuration');
    console.log('Please set up your .env file with the required API keys');
  }

  console.log('\n🏁 Test completed!');
}

// Run the test
testTotemSystem().catch(console.error); 