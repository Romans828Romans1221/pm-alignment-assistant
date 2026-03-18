const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const {
  createCheckoutSession,
  upgradeToPro
} = require('../services/paymentService');
const { validateTeamCode } = require('../middleware/validate');
const { verifyToken } = require('../middleware/auth');

router.post('/api/create-checkout-session',
  verifyToken,
  validateTeamCode,
  async (req, res, next) => {
    try {
      const { teamCode } = req.body;

      logger.info('Checkout session requested', {
        teamCode,
        uid: req.user.uid
      });

      const url = await createCheckoutSession(
        teamCode,
        req.headers.origin
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
  async (req, res, next) => {
    try {
      const { teamCode } = req.body;

      logger.info('Upgrade verification requested', {
        teamCode,
        uid: req.user.uid
      });

      const result = await upgradeToPro(
        req.app.locals.db,
        teamCode
      );

      return res.json(result);

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;