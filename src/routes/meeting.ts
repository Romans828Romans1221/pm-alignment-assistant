import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyToken } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

router.post('/api/meeting-score', verifyToken, async (req: Request, res: Response) => {
    try {
        const { goal, teamData } = req.body;

        if (!teamData || teamData.length === 0) {
            return res.status(400).json({ error: 'No team data provided' });
        }

        const avgScore = Math.round(
            teamData.reduce((sum: number, m: any) => sum + m.score, 0) / teamData.length
        );
        const lowScoreMembers = teamData.filter((m: any) => m.score < 70);
        const alignedMembers = teamData.filter((m: any) => m.score >= 80);

        const prompt = `
            You are analyzing whether a team meeting is necessary based on alignment data.
            
            Project Goal: "${goal}"
            Team Size: ${teamData.length}
            Average Alignment Score: ${avgScore}%
            Members fully aligned (80%+): ${alignedMembers.length}
            Members needing attention (below 70%): ${lowScoreMembers.length}
            
            Team breakdown:
            ${teamData.map((m: any) =>
                `- ${m.name} (${m.role}): ${m.score}%${m.clarification
                    ? ` | Question: "${m.clarification}"` : ''}`
            ).join('\n')}
            
            Determine if a full team meeting is necessary or if targeted conversations are more efficient.
            
            Return ONLY this JSON with no markdown:
            {
                "verdict": "not_needed" or "partial" or "needed",
                "summary": "One clear sentence explaining the verdict",
                "timeSavedMinutes": number,
                "needsAttention": [{"name": "string", "role": "string", "score": number}],
                "suggestedAgenda": "Brief agenda if meeting needed, otherwise null",
                "recommendation": "2-3 sentences of specific actionable guidance"
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text()
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        const assessment = JSON.parse(text);

        logger.info('Meeting score generated', {
            verdict: assessment.verdict,
            avgScore
        });

        res.json({ success: true, assessment });

    } catch (error: any) {
        logger.error('Meeting score error', { message: error.message });
        res.status(500).json({ error: 'Failed to generate meeting assessment' });
    }
});

export default router;