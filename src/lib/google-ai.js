import { GoogleGenerativeAI } from '@google/generative-ai';
import { getEnvVar } from './env-validation';

// Validate and get API key
let genAI;
try {
  const apiKey = getEnvVar('GEMINI_API_KEY');
  genAI = new GoogleGenerativeAI(apiKey);
} catch (error) {
  console.error('❌ Failed to initialize Gemini AI:', error.message);
  // Create a dummy instance to prevent crashes, but it won't work
  genAI = new GoogleGenerativeAI('');
}

export { genAI }; 