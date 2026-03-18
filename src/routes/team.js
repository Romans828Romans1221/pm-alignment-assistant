const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { analyzeAlignment } = require('../services/aiService');
const {
    checkAndRecordUsage,
    getTeamGoal,
    saveAlignmentResult
} = require('../services/teamService');

router.post('/api/analyze-alignment', async (req, res, next) => {
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

        // --- VALIDATE REQUIRED FIELDS ---
        if (!teamCode || !name || !understanding) {
            return res.status(400).json({
                error: 'teamCode, name, and understanding are required'
            });
        }

        logger.info('Alignment check received', { teamCode, name, role });

        // --- CHECK AND RECORD USAGE ---
        await checkAndRecordUsage(
            req.app.locals.db,
            teamCode,
            deviceId
        );

        // --- GET LEADER GOAL ---
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

        // --- CALL AI SERVICE ---
        const analysis = await analyzeAlignment(
            leaderGoal,
            leaderContext,
            name,
            role,
            understanding
        );

        // --- SAVE RESULT ---
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
});

module.exports = router;