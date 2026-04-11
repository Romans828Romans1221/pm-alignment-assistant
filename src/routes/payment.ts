import { Router, Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import {
  createCheckoutSession,
  upgradeToPro
} from '../services/paymentService';
import { validateTeamCode } from '../middleware/validate';
import { verifyToken } from '../middleware/auth';

const router = Router();

// This interface defines the strict structure expected from the frontend
interface PaymentRequestBody {
  teamCode: string;
}

router.post('/api/create-checkout-session',
  verifyToken,
  validateTeamCode,
  async (req: Request<{}, any, PaymentRequestBody>, res: Response, next: NextFunction) => {
    try {
      const { teamCode } = req.body;
      
      // Cast req to 'any' to access the user object injected by verifyToken middleware
      const uid = (req as any).user?.uid || 'anonymous';

      logger.info('Checkout session requested', {
        teamCode,
        uid
      });

      // req.headers.origin can be undefined, so we provide a safe fallback or cast it
      const origin = req.headers.origin || 'http://localhost:5173';

      const url = await createCheckoutSession(
        teamCode,
        origin
      );

      return res.json({ url });

    } catch (error) {
      next(error);
    }
  }
);

router.post('/api/verify-upgrade',
  verifyToken,
  validateTeamCode,
  async (req: Request<{}, any, PaymentRequestBody>, res: Response, next: NextFunction) => {
    try {
      const { teamCode } = req.body;
      const uid = (req as any).user?.uid || 'anonymous';

      logger.info('Upgrade verification requested', {
        teamCode,
        uid
      });

      const db = req.app.locals.db;

      const result = await upgradeToPro(db, teamCode);

      return res.json(result);

    } catch (error) {
      next(error);
    }
  }
);

export default router;
