import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger';
import { AppError } from '../utils/errors';
import { AlignmentResult } from '../types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_KEY');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export type AssessmentMode = 'goal-understanding' | 'role-clarity';

export const buildPrompt = (
  leaderGoal: string,
  leaderContext: string,
  name: string,
  role: string,
  understanding: string,
  mode: AssessmentMode = 'goal-understanding'
): string => {
  if (mode === 'role-clarity') {
    return `
      You are evaluating whether a team member clearly understands their SPECIFIC ROLE in achieving a team goal.
      
      Team Goal: "${leaderGoal}"
      Context: "${leaderContext}"
      
      Team Member: ${name}
      Their Role: ${role}
      Their Response (what they think they personally need to do): "${understanding}"
      
      Evaluate whether ${name} as a ${role} demonstrates:
      1. Clear understanding of their specific responsibilities
      2. How their role contributes to the overall goal
      3. Awareness of key deliverables, timelines, or dependencies relevant to their role
      4. Any critical gaps in their role-specific understanding
      
      Be specific to their role as a ${role}. A Designer should be scored on design deliverables. An Engineer on technical implementation. A PM on coordination and milestones.
      
      Return strictly this JSON with no markdown:
      { 
        "score": (0-100), 
        "meetingType": "None" or "1:1 Meeting", 
        "feedback": "2-3 sentences of specific role-based feedback mentioning their role as ${role} and specific gaps or strengths"
      }
    `;
  }

  return `
    You are evaluating whether a team member understands their team's goal.
    
    Leader Goal: "${leaderGoal}"
    Context: "${leaderContext}"
    Member (${name}, ${role}) Understanding: "${understanding}"
    
    Compare the member's understanding to the leader's goal.
    Score how well they captured the essence, priorities, and context of the goal.
    
    Return strictly this JSON with no markdown:
    { 
      "score": (0-100), 
      "meetingType": "None" or "1:1 Meeting", 
      "feedback": "2-3 sentences of specific actionable feedback"
    }
  `;
};

export const analyzeAlignment = async (
  leaderGoal: string,
  leaderContext: string,
  name: string,
  role: string,
  understanding: string,
  mode: AssessmentMode = 'goal-understanding'
): Promise<AlignmentResult> => {
  try {
    logger.info('Calling Gemini AI', { name, role, mode });
    const prompt = buildPrompt(leaderGoal, leaderContext, name, role, understanding, mode);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text()
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const analysis = JSON.parse(text) as AlignmentResult;
    logger.info('Gemini response received', { score: analysis.score, mode });
    return analysis;
  } catch (error: any) {
    logger.error('Gemini AI error', { message: error.message });
    throw new AppError('AI analysis failed. Please try again.', 500);
  }
};