const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_KEY');
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

const buildPrompt = (leaderGoal, leaderContext, name, role, understanding) => {
  return `
    Leader Goal: "${leaderGoal}"
    Context: "${leaderContext}"
    Member (${name}, ${role}) Understanding: "${understanding}"
    Compare them. Return strictly this JSON:
    { "score": (0-100), "meetingType": "None" or "1:1 Meeting", "feedback": "Short advice" }
  `;
};

const analyzeAlignment = async (leaderGoal, leaderContext, name, role, understanding) => {
  try {
    logger.info('Calling Gemini AI', { name, role });

    const prompt = buildPrompt(leaderGoal, leaderContext, name, role, understanding);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text()
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const analysis = JSON.parse(text);
    logger.info('Gemini response received', { score: analysis.score });

    return analysis;
  } catch (error) {
    logger.error('Gemini AI error', { message: error.message });
    throw new AppError('AI analysis failed. Please try again.', 500);
  }
};

module.exports = { analyzeAlignment, buildPrompt };