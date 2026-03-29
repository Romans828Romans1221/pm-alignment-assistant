"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveAlignmentResult = exports.getTeamGoal = exports.checkAndRecordUsage = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const errors_1 = require("../utils/errors");
/**
 * Checks usage limits for both the device and the team.
 * Returns a boolean flag indicating if the Master Key was used.
 * Note: 'db' is typed as 'any' here to ensure compatibility with your existing Firebase Admin initialization.
 */
const checkAndRecordUsage = async (db, teamCode, deviceId) => {
    // --- MASTER KEY CHECK ---
    if (teamCode === process.env.MASTER_KEY) {
        logger_1.default.info('Master key detected — skipping usage limits');
        return { isMasterKey: true };
    }
    // --- DEVICE LIMIT CHECK ---
    if (deviceId) {
        const deviceRef = db.collection('device-usage').doc(deviceId);
        const deviceDoc = await deviceRef.get();
        const deviceData = deviceDoc.data();
        if (deviceDoc.exists &&
            deviceData &&
            deviceData.totalFreeChecks >= 15 &&
            !deviceData.isDevDevice) {
            logger_1.default.warn('Device limit reached', { deviceId });
            throw new errors_1.PaymentRequiredError('This device has reached the maximum free checks.');
        }
        await deviceRef.set({
            totalFreeChecks: (deviceData?.totalFreeChecks || 0) + 1,
            lastUsed: new Date()
        }, { merge: true });
    }
    // --- TEAM LIMIT CHECK ---
    const usageRef = db.collection('team-usage').doc(teamCode);
    const usageDoc = await usageRef.get();
    const usageData = usageDoc.data();
    if (usageDoc.exists &&
        usageData &&
        usageData.count >= 30 &&
        !usageData.isPro) {
        logger_1.default.warn('Team limit reached', { teamCode });
        throw new errors_1.PaymentRequiredError('This team has used its 30 free checks. Upgrade to Clarity Pro!');
    }
    // --- RECORD USAGE ---
    await usageRef.set({
        count: (usageData?.count || 0) + 1,
        lastUsed: new Date()
    }, { merge: true });
    logger_1.default.info('Usage recorded', { teamCode });
    return { isMasterKey: false };
};
exports.checkAndRecordUsage = checkAndRecordUsage;
/**
 * Retrieves the team's mission/goal from Firestore.
 */
const getTeamGoal = async (db, teamCode) => {
    const snapshot = await db
        .collection('goals')
        .where('teamCode', '==', teamCode)
        .limit(1)
        .get();
    if (snapshot.empty) {
        logger_1.default.warn('Goal not found', { teamCode });
        throw new errors_1.NotFoundError('Goal not found for this team code.');
    }
    const data = snapshot.docs[0].data();
    logger_1.default.info('Team goal retrieved', { teamCode });
    return {
        leaderGoal: data.goal,
        leaderContext: data.context || ''
    };
};
exports.getTeamGoal = getTeamGoal;
/**
 * Saves the final Gemini analysis back to the database.
 * Strictly requires the 'analysis' parameter to match the AlignmentResult type.
 */
const saveAlignmentResult = async (db, teamCode, role, name, understanding, analysis) => {
    await db.collection('alignments').add({
        teamCode,
        role,
        name,
        understanding,
        analysis,
        timestamp: new Date()
    });
    logger_1.default.info('Alignment result saved', { teamCode, score: analysis.score });
};
exports.saveAlignmentResult = saveAlignmentResult;
