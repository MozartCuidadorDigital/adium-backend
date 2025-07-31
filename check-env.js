import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Environment Variables Check:');
console.log('OPENAI_MODEL:', process.env.OPENAI_MODEL);
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('ELEVENLABS_API_KEY exists:', !!process.env.ELEVENLABS_API_KEY);
console.log('DEEPGRAM_API_KEY exists:', !!process.env.DEEPGRAM_API_KEY); 