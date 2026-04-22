import express, { Request, Response } from 'express';
import { db } from '../../index';
import { sendBulkInvites } from '../services/emailService';
import { verifyToken } from '../middleware/auth';
import logger from '../utils/logger';

const router = express.Router();

router.post('/send-invites', verifyToken, async (req: Request, res: Response) => {
    try {
        const { members, teamGoal, inviteLink, sessionId } = req.body;
        const user = (req as any).user;

        if (!members || !Array.isArray(members) || members.length === 0) {
            return res.status(400).json({ error: 'Please provide at least one team member.' });
        }

        if (!teamGoal || !inviteLink) {
            return res.status(400).json({ error: 'Team goal and invite link are required.' });
        }

        if (members.length > 20) {
            return res.status(400).json({ error: 'Maximum 20 members per invite batch.' });
        }

        const leaderName = user.name || user.email || 'Your Team Leader';

        // Save team roster to Firestore under leader profile
        const rosterRef = db.collection('team-rosters').doc(user.uid);
        await rosterRef.set({
            members,
            lastUpdated: new Date().toISOString(),
            leaderEmail: user.email,
            leaderName
        }, { merge: true });

        // Send emails
        const result = await sendBulkInvites(
            members,
            leaderName,
            teamGoal,
            inviteLink
        );

        logger.info('Bulk invites sent', { sent: result.sent, failed: result.failed });

        res.json({
            success: true,
            message: `Successfully sent ${result.sent} invite${result.sent !== 1 ? 's' : ''}.${result.failed > 0 ? ` ${result.failed} failed.` : ''}`,
            sent: result.sent,
            failed: result.failed
        });

    } catch (error: any) {
        logger.error('Invite error', { message: error.message });
        res.status(500).json({ error: error.message || 'Failed to send invites.' });
    }
});

router.get('/team-roster', verifyToken, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const rosterRef = db.collection('team-rosters').doc(user.uid);
        const doc = await rosterRef.get();

        if (!doc.exists) {
            return res.json({ members: [] });
        }

        res.json({ members: doc.data()?.members || [] });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to load team roster.' });
    }
});

export default router;