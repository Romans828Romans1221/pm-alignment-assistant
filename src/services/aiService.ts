import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger';
import { AppError } from '../utils/errors';
import { AlignmentResult } from '../types'; // Pulling in the type you created in Session 6

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_KEY');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export const buildPrompt = (
  leaderGoal: string,
  leaderContext: string,
  name: string,
  role: string,
  understanding: string
): string => {
  return `
    Leader Goal: "${leaderGoal}"
    Context: "${leaderContext}"
    Member (${name}, ${role}) Understanding: "${understanding}"
    Compare them. Return strictly this JSON:
    { "score": (0-100), "meetingType": "None" or "1:1 Meeting", "feedback": "Short advice" }
  `;
};

export const analyzeAlignment = async (
  leaderGoal: string,
  leaderContext: string,
  name: string,
  role: string,
  understanding: string
): Promise<AlignmentResult> => {
  try {
    logger.info('Calling Gemini AI', { name, role });

    const prompt = buildPrompt(leaderGoal, leaderContext, name, role, understanding);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text()
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    // We cast the parsed JSON as AlignmentResult so the rest of the app knows its structure
    const analysis = JSON.parse(text) as AlignmentResult;
    logger.info('Gemini response received', { score: analysis.score });

    return analysis;
  } catch (error: any) {
    logger.error('Gemini AI error', { message: error.message });
    throw new AppError('AI analysis failed. Please try again.', 500);
  }
};