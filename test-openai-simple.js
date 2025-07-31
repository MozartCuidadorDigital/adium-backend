import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

async function testOpenAISimple() {
  console.log('🧪 Testing OpenAI simple...\n');

  try {
    console.log('🔍 Creating OpenAI client...');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    console.log('🔍 API Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('🔍 API Key first 10 chars:', process.env.OPENAI_API_KEY?.substring(0, 10));
    
    console.log('📤 Sending simple request...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Say hello' }
      ],
      max_tokens: 50
    });
    
    console.log('✅ Response received:', completion.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Error type:', error.constructor.name);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
  }
}

// Run test
testOpenAISimple().then(() => {
  console.log('Test finished');
  process.exit(0);
}).catch((error) => {
  console.error('Test error:', error);
  process.exit(1);
}); 