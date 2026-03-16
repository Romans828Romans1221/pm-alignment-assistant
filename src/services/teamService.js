const logger = require('../utils/logger');
const { PaymentRequiredError, NotFoundError } = require('../utils/errors');

const checkAndRecordUsage = async (db, teamCode, deviceId) => {

  // --- MASTER KEY CHECK ---
  if (teamCode === process.env.MASTER_KEY) {
    logger.info('Master key detected — skipping usage limits');
    return { isMasterKey: true };
  }

  // --- DEVICE LIMIT CHECK ---
  if (deviceId) {
    const deviceRef = db.collection('device-usage').doc(deviceId);
    const deviceDoc = await deviceRef.get();

    if (
      deviceDoc.exists &&
      deviceDoc.data().totalFreeChecks >= 15 &&
      !deviceDoc.data().isDevDevice
    ) {
      logger.warn('Device limit reached', { deviceId });
      throw new PaymentRequiredError(
        'This device has reached the maximum free checks.'
      );
    }

    await deviceRef.set({
      totalFreeChecks: (deviceDoc.data()?.totalFreeChecks || 0) + 1,
      lastUsed: new Date()
    }, { merge: true });
  }

  // --- TEAM LIMIT CHECK ---
  const usageRef = db.collection('team-usage').doc(teamCode);
  const usageDoc = await usageRef.get();

  if (
    usageDoc.exists &&
    usageDoc.data().count >= 30 &&
    !usageDoc.data().isPro
  ) {
    logger.warn('Team limit reached', { teamCode });
    throw new PaymentRequiredError(
      'This team has used its 30 free checks. Upgrade to Clarity Pro!'
    );
  }

  // --- RECORD USAGE ---
  await usageRef.set({
    count: (usageDoc.data()?.count || 0) + 1,
    lastUsed: new Date()
  }, { merge: true });

  logger.info('Usage recorded', { teamCode });
  return { isMasterKey: false };
};

const getTeamGoal = async (db, teamCode) => {
  const snapshot = await db
    .collection('goals')
    .where('teamCode', '==', teamCode)
    .limit(1)
    .get();

  if (snapshot.empty) {
    logger.warn('Goal not found', { teamCode });
    throw new NotFoundError('Goal not found for this team code.');
  }

  const data = snapshot.docs[0].data();
  logger.info('Team goal retrieved', { teamCode });

  return {
    leaderGoal: data.goal,
    leaderContext: data.context || ''
  };
};

const saveAlignmentResult = async (db, teamCode, role, name, understanding, analysis) => {
  await db.collection('alignments').add({
    teamCode,
    role,
    name,
    understanding,
    analysis,
    timestamp: new Date()
  });
  logger.info('Alignment result saved', { teamCode, score: analysis.score });
};

module.exports = {
  checkAndRecordUsage,
  getTeamGoal,
  saveAlignmentResult
};