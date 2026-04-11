"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeAlignment = exports.buildPrompt = void 0;
const generative_ai_1 = require("@google/generative-ai");
const logger_1 = __importDefault(require("../utils/logger"));
const errors_1 = require("../utils/errors");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_KEY');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const buildPrompt = (leaderGoal, leaderContext, name, role, understanding) => {
    return `
    Leader Goal: "${leaderGoal}"
    Context: "${leaderContext}"
    Member (${name}, ${role}) Understanding: "${understanding}"
    Compare them. Return strictly this JSON:
    { "score": (0-100), "meetingType": "None" or "1:1 Meeting", "feedback": "Short advice" }
  `;
};
exports.buildPrompt = buildPrompt;
const analyzeAlignment = async (leaderGoal, leaderContext, name, role, understanding) => {
    try {
        logger_1.default.info('Calling Gemini AI', { name, role });
        const prompt = (0, exports.buildPrompt)(leaderGoal, leaderContext, name, role, understanding);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text()
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
        // We cast the parsed JSON as AlignmentResult so the rest of the app knows its structure
        const analysis = JSON.parse(text);
        logger_1.default.info('Gemini response received', { score: analysis.score });
        return analysis;
    }
    catch (error) {
        logger_1.default.error('Gemini AI error', { message: error.message });
        throw new errors_1.AppError('AI analysis failed. Please try again.', 500);
    }
};
exports.analyzeAlignment = analyzeAlignment;
