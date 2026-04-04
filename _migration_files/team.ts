import { Router, Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { analyzeAlignment } from '../services/aiService';
import {
  checkAndRecordUsage,
  getTeamGoal,
  saveAlignmentResult
} from '../services/teamService';

import { validateAlignmentCheck } from '../middleware/validate';
import { optionalAuth } from '../middleware/auth';

const router = Router();

interface AlignmentRequestBody {
  teamCode: string;
  role: string;
  name: string;
  understanding: string;
  goal?: string;
  context?: string;
  deviceId?: string;
}

// Path is now /analyze-alignment (not /api/analyze-alignment)
// because index.ts mounts this router under /api/v1
router.post('/analyze-alignment',
  optionalAuth,
  validateAlignmentCheck,
  async (req: Request<{}, any, AlignmentRequestBody>, res: Response, next: NextFunction) => {
    try {
      const {
        teamCode,
        role,
        name,
        understanding,
        goal,
        context,
        deviceId
      } = req.body;

      const uid = (req as any).user?.uid || 'anonymous';
      const requestId = res.locals.requestId;

      logger.info('Alignment check received', {
        requestId,
        teamCode,
        name,
        role,
        uid
      });

      const db = req.app.locals.db;

      await checkAndRecordUsage(db, teamCode, deviceId);

      let leaderGoal = goal;
      let leaderContext = context || '';

      if (!leaderGoal) {
        const teamGoal = await getTeamGoal(db, teamCode);
        leaderGoal = teamGoal.leaderGoal;
        leaderContext = teamGoal.leaderContext;
      }

      const analysis = await analyzeAlignment(
        leaderGoal as string,
        leaderContext,
        name,
        role,
        understanding
      );

      await saveAlignmentResult(
        db,
        teamCode,
        role,
        name,
        understanding,
        analysis
      );

      logger.info('Alignment check complete', {
        requestId,
        teamCode,
        score: analysis.score
      });

      return res.json({ success: true, analysis });

    } catch (error) {
      next(error);
    }
  }
);

export default router;
