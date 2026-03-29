"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = __importDefault(require("../utils/logger"));
const aiService_1 = require("../services/aiService");
const teamService_1 = require("../services/teamService");
// Assuming your middleware files are still .js, TypeScript will still import them fine
// because of the allowJs: true setting in your tsconfig.json.
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/api/analyze-alignment', auth_1.optionalAuth, validate_1.validateAlignmentCheck, 
// We use Express's generic Request type to explicitly type the req.body
async (req, res, next) => {
    try {
        const { teamCode, role, name, understanding, goal, context, deviceId } = req.body;
        // We cast req to 'any' just for this line because the standard Express Request 
        // doesn't have a 'user' property natively.
        const uid = req.user?.uid || 'anonymous';
        logger_1.default.info('Alignment check received', {
            teamCode,
            name,
            role,
            uid
        });
        // Express implicitly types locals as Record<string, any>, so this is safe.
        const db = req.app.locals.db;
        await (0, teamService_1.checkAndRecordUsage)(db, teamCode, deviceId);
        let leaderGoal = goal;
        let leaderContext = context || '';
        if (!leaderGoal) {
            const teamGoal = await (0, teamService_1.getTeamGoal)(db, teamCode);
            leaderGoal = teamGoal.leaderGoal;
            leaderContext = teamGoal.leaderContext;
        }
        // We use the TypeScript '!' (non-null assertion) or an explicit cast 
        // since we verified leaderGoal exists via the database check above.
        const analysis = await (0, aiService_1.analyzeAlignment)(leaderGoal, leaderContext, name, role, understanding);
        await (0, teamService_1.saveAlignmentResult)(db, teamCode, role, name, understanding, analysis);
        logger_1.default.info('Alignment check complete', {
            teamCode,
            score: analysis.score
        });
        return res.json({ success: true, analysis });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
