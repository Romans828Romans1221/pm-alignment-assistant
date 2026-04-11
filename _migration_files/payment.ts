import { Router, Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import logger from '../utils/logger';
import {
  createCheckoutSession,
  upgradeToPro
} from '../services/paymentService';
import { validateTeamCode } from '../middleware/validate';
import { verifyToken } from '../middleware/auth';

const router = Router();

interface PaymentRequestBody {
  teamCode: string;
}

// ── Create Checkout Session ──
router.post('/create-checkout-session',
  verifyToken,
  validateTeamCode,
  async (req: Request<{}, any, PaymentRequestBody>, res: Response, next: NextFunction) => {
    try {
      const { teamCode } = req.body;
      const uid = (req as any).user?.uid || 'anonymous';
      const requestId = res.locals.requestId;

      logger.info('Checkout session requested', { requestId, teamCode, uid });

      const origin = req.headers.origin || 'http://localhost:5173';
      const url = await createCheckoutSession(teamCode, origin);

      return res.json({ url });
    } catch (error) {
      next(error);
    }
  }
);

// ── Manual Upgrade Verification (fallback) ──
router.post('/verify-upgrade',
  verifyToken,
  validateTeamCode,
  async (req: Request<{}, any, PaymentRequestBody>, res: Response, next: NextFunction) => {
    try {
      const { teamCode } = req.body;
      const uid = (req as any).user?.uid || 'anonymous';
      const requestId = res.locals.requestId;

      logger.info('Upgrade verification requested', { requestId, teamCode, uid });

      const db = req.app.locals.db;
      const result = await upgradeToPro(db, teamCode);

      return res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Stripe Webhook — The RELIABLE Way to Handle Payments
// ============================================================================
// Why this matters:
//   Your original flow: User pays → Stripe redirects to ?upgrade=success →
//   Frontend POSTs to /verify-upgrade → Backend marks team as Pro.
//
//   Problem: If the user closes the tab after paying but BEFORE the redirect,
//   they paid $49 but never got upgraded. That's a support nightmare.
//
//   Solution: Stripe webhooks. Stripe calls YOUR server directly when payment
//   succeeds, regardless of what the user's browser does. This is how every
//   production payment system works.
//
// Setup: In your Stripe Dashboard → Developers → Webhooks → Add endpoint:
//   URL: https://your-cloudrun-url/api/v1/webhooks/stripe
//   Events: checkout.session.completed
// ============================================================================

router.post('/webhooks/stripe', async (req: Request, res: Response) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error('Stripe webhook secret not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const signature = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    // Verify the request actually came from Stripe (not a spoofed request)
    // This uses the raw body (configured in index.ts) + the webhook secret
    event = stripe.webhooks.constructEvent(
      req.body,       // Raw body (Buffer), not parsed JSON
      signature,
      webhookSecret
    );
  } catch (err: any) {
    logger.error('Stripe webhook signature verification failed', {
      message: err.message,
    });
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const teamCode = session.metadata?.teamCode || session.client_reference_id;

      if (!teamCode) {
        logger.error('Webhook: No teamCode found in session', {
          sessionId: session.id,
        });
        break;
      }

      logger.info('Webhook: Payment succeeded', {
        teamCode,
        sessionId: session.id,
        amount: session.amount_total,
      });

      try {
        const db = req.app.locals.db;
        await upgradeToPro(db, teamCode);
        logger.info('Webhook: Team upgraded via webhook', { teamCode });
      } catch (error) {
        logger.error('Webhook: Failed to upgrade team', { teamCode, error });
        // Return 500 so Stripe retries the webhook
        return res.status(500).json({ error: 'Upgrade failed' });
      }
      break;
    }

    default:
      logger.info('Webhook: Unhandled event type', { type: event.type });
  }

  // Acknowledge receipt (Stripe stops retrying once it gets a 200)
  res.json({ received: true });
});

export default router;
