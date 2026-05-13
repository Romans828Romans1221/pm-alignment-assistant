import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger';

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

router.post('/api/extract-document', async (req: Request, res: Response) => {
  try {
    const { documentText, fileName } = req.body;

    if (!documentText || documentText.trim().length < 50) {
      return res.status(400).json({
        error: 'Document appears to be empty or too short to extract meaningful content.'
      });
    }

    const prompt = `
      You are analyzing a business document to extract key information for a team alignment check.
      
      Document name: "${fileName}"
      Document content: "${documentText.substring(0, 8000)}"
      
      Extract the following information from this document:
      
      1. GOAL: The primary objective or goal described in this document. 
         Should be one clear concise sentence.
      
      2. CONTEXT: Key context, background, constraints, deadlines, or details 
         that team members need to understand. 2-4 sentences maximum.
      
      3. ROLE_EXPECTATIONS: If the document mentions specific roles, responsibilities, 
         or deliverables for different team members extract them here. 
         Format as role: responsibility. If no specific roles are mentioned leave blank.
      
      Return ONLY this JSON with no markdown or explanation:
      {
        "goal": "extracted goal here",
        "context": "extracted context here", 
        "roleExpectations": "extracted role expectations here or empty string",
        "confidence": 85
      }
      
      Confidence should be 0-100 based on how clearly the document states a goal.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text()
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const extracted = JSON.parse(text);

    logger.info('Document extracted successfully', {
      fileName,
      confidence: extracted.confidence
    });

    res.json({
      success: true,
      extracted
    });

  } catch (error: any) {
    logger.error('Document extraction error', { message: error.message });
    res.status(500).json({
      error: 'Failed to extract content from document. Please try again or enter details manually.'
    });
  }
});

export default router;