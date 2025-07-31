import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

async function testOpenAIExact() {
  console.log('🧪 Testing OpenAI exact...\n');

  try {
    console.log('🔍 Creating OpenAI client...');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    console.log('📤 Sending request with exact same config as working test...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Eres un asistente de voz amigable. Responde en español de manera natural.' },
        { role: 'user', content: 'Hola, ¿cómo estás?' }
      ],
      max_tokens: 100,
      temperature: 0.7
    });
    
    console.log('✅ Response received:', completion.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run test
testOpenAIExact().then(() => {
  console.log('Test finished');
  process.exit(0);
}).catch((error) => {
  console.error('Test error:', error);
  process.exit(1);
}); 