import logger from '../utils/logger';
import { PaymentRequiredError, NotFoundError } from '../utils/errors';
import { AlignmentResult } from '../types';

/**
 * Checks usage limits for both the device and the team.
 * Returns a boolean flag indicating if the Master Key was used.
 * Note: 'db' is typed as 'any' here to ensure compatibility with your existing Firebase Admin initialization.
 */
export const checkAndRecordUsage = async (
  db: any, 
  teamCode: string, 
  deviceId?: string
): Promise<{ isMasterKey: boolean }> => {

  // --- MASTER KEY CHECK ---
  if (teamCode === process.env.MASTER_KEY) {
    logger.info('Master key detected — skipping usage limits');
    return { isMasterKey: true };
  }

  // --- DEVICE LIMIT CHECK ---
  if (deviceId) {
    const deviceRef = db.collection('device-usage').doc(deviceId);
    const deviceDoc = await deviceRef.get();
    const deviceData = deviceDoc.data();

    if (
      deviceDoc.exists &&
      deviceData &&
      deviceData.totalFreeChecks >= 15 &&
      !deviceData.isDevDevice
    ) {
      logger.warn('Device limit reached', { deviceId });
      throw new PaymentRequiredError(
        'This device has reached the maximum free checks.'
      );
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

  if (
    usageDoc.exists &&
    usageData &&
    usageData.count >= 30 &&
    !usageData.isPro
  ) {
    logger.warn('Team limit reached', { teamCode });
    throw new PaymentRequiredError(
      'This team has used its 30 free checks. Upgrade to Clarity Pro!'
    );
  }

  // --- RECORD USAGE ---
  await usageRef.set({
    count: (usageData?.count || 0) + 1,
    lastUsed: new Date()
  }, { merge: true });

  logger.info('Usage recorded', { teamCode });
  return { isMasterKey: false };
};

/**
 * Retrieves the team's mission/goal from Firestore.
 */
export const getTeamGoal = async (
  db: any, 
  teamCode: string
): Promise<{ leaderGoal: string; leaderContext: string }> => {
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

/**
 * Saves the final Gemini analysis back to the database.
 * Strictly requires the 'analysis' parameter to match the AlignmentResult type.
 */
export const saveAlignmentResult = async (
  db: any,
  teamCode: string,
  role: string,
  name: string,
  understanding: string,
  analysis: AlignmentResult
): Promise<void> => {
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