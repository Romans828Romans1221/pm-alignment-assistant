const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { analyzeAlignment } = require('../services/aiService');
const {
  checkAndRecordUsage,
  getTeamGoal,
  saveAlignmentResult
} = require('../services/teamService');
const { validateAlignmentCheck } = require('../middleware/validate');
const { optionalAuth } = require('../middleware/auth');

router.post('/api/analyze-alignment',
  optionalAuth,
  validateAlignmentCheck,
  async (req, res, next) => {
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

      logger.info('Alignment check received', {
        teamCode,
        name,
        role,
        uid: req.user?.uid || 'anonymous'
      });

      await checkAndRecordUsage(
        req.app.locals.db,
        teamCode,
        deviceId
      );

      let leaderGoal = goal;
      let leaderContext = context || '';

      if (!leaderGoal) {
        const teamGoal = await getTeamGoal(
          req.app.locals.db,
          teamCode
        );
        leaderGoal = teamGoal.leaderGoal;
        leaderContext = teamGoal.leaderContext;
      }

      const analysis = await analyzeAlignment(
        leaderGoal,
        leaderContext,
        name,
        role,
        understanding
      );

      await saveAlignmentResult(
        req.app.locals.db,
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

module.exports = router;