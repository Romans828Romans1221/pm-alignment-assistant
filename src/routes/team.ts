import { Router, Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { analyzeAlignment } from '../services/aiService';
import {
  checkAndRecordUsage,
  getTeamGoal,
  saveAlignmentResult
} from '../services/teamService';

// Assuming your middleware files are still .js, TypeScript will still import them fine
// because of the allowJs: true setting in your tsconfig.json.
import { validateAlignmentCheck } from '../middleware/validate';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// This interface is the "contract" for what data this endpoint expects to receive.
interface AlignmentRequestBody {
  teamCode: string;
  role: string;
  name: string;
  understanding: string;
  goal?: string;
  context?: string;
  deviceId?: string;
  mode?: 'goal-understanding' | 'role-clarity';
}

router.post('/api/analyze-alignment',
  optionalAuth,
  validateAlignmentCheck,
  // We use Express's generic Request type to explicitly type the req.body
  async (req: Request<{}, any, AlignmentRequestBody>, res: Response, next: NextFunction) => {
    try {
      const {
        teamCode,
        role,
        name,
        understanding,
        goal,
        context,
        deviceId,
        mode = 'goal-understanding'
      } = req.body;

      // We cast req to 'any' just for this line because the standard Express Request 
      // doesn't have a 'user' property natively.
      const uid = (req as any).user?.uid || 'anonymous';

      logger.info('Alignment check received', {
        teamCode,
        name,
        role,
        uid
      });

      // Express implicitly types locals as Record<string, any>, so this is safe.
      const db = req.app.locals.db;

      await checkAndRecordUsage(db, teamCode, deviceId);

      let leaderGoal = goal;
      let leaderContext = context || '';

      if (!leaderGoal) {
        const teamGoal = await getTeamGoal(db, teamCode);
        leaderGoal = teamGoal.leaderGoal;
        leaderContext = teamGoal.leaderContext;
      }

      // We use the TypeScript '!' (non-null assertion) or an explicit cast 
      // since we verified leaderGoal exists via the database check above.
      const analysis = await analyzeAlignment(
        leaderGoal as string,
        leaderContext,
        name,
        role,
        understanding,
        mode
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