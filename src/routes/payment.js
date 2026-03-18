const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { createCheckoutSession, upgradeToPro } = require('../services/paymentService');
const { ValidationError } = require('../utils/errors');

router.post('/api/create-checkout-session', async (req, res, next) => {
  try {
    const { teamCode } = req.body;

    if (!teamCode) {
      throw new ValidationError('Team code is required');
    }

    logger.info('Checkout session requested', { teamCode });

    const url = await createCheckoutSession(
      teamCode,
      req.headers.origin
    );

    return res.json({ url });

  } catch (error) {
    next(error);
  }
});

router.post('/api/verify-upgrade', async (req, res, next) => {
  try {
    const { teamCode } = req.body;

    if (!teamCode) {
      throw new ValidationError('Team code is required');
    }

    logger.info('Upgrade verification requested', { teamCode });

    const result = await upgradeToPro(
      req.app.locals.db,
      teamCode
    );

    return res.json(result);

  } catch (error) {
    next(error);
  }
});

module.exports = router;