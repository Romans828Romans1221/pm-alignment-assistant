import Stripe from 'stripe';
import logger from '../utils/logger';
import { AppError } from '../utils/errors';

// Initialize Stripe using standard TypeScript class instantiation
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

/**
 * Creates a Stripe checkout session for upgrading a team to Pro.
 * Returns the Stripe checkout URL as a string (or null if it fails).
 */
export const createCheckoutSession = async (
    teamCode: string, 
    origin: string
): Promise<string | null> => {
    try {
        logger.info('Creating Stripe checkout session', { teamCode });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Clarity Pro - Team Upgrade',
                            description: `Unlimited alignment checks for team code: ${teamCode}`,
                        },
                        unit_amount: 4900,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/leader?code=${teamCode}&upgrade=success`,
            cancel_url: `${origin}/leader?code=${teamCode}`,
            client_reference_id: teamCode,
            metadata: { teamCode }
        });

        logger.info('Stripe session created', { teamCode, sessionId: session.id });
        return session.url;

    } catch (error: any) {
        logger.error('Stripe checkout error', { message: error.message });
        throw new AppError('Could not create checkout session', 500);
    }
};

/**
 * Upgrades a team to Pro status in the Firestore database.
 * Explicitly returns a success boolean object.
 */
export const upgradeToPro = async (
    db: any, 
    teamCode: string
): Promise<{ success: boolean }> => {
    try {
        logger.info('Upgrading team to Pro', { teamCode });

        await db.collection('team-usage').doc(teamCode).set({
            isPro: true,
            upgradedAt: new Date()
        }, { merge: true });

        logger.info('Team upgraded successfully', { teamCode });
        return { success: true };

    } catch (error: any) {
        logger.error('Upgrade error', { message: error.message });
        throw new AppError('Failed to verify upgrade', 500);
    }
};