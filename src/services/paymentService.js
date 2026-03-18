const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

const createCheckoutSession = async (teamCode, origin) => {
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

    } catch (error) {
        logger.error('Stripe checkout error', { message: error.message });
        throw new AppError('Could not create checkout session', 500);
    }
};

const upgradeToPro = async (db, teamCode) => {
    try {
        logger.info('Upgrading team to Pro', { teamCode });

        await db.collection('team-usage').doc(teamCode).set({
            isPro: true,
            upgradedAt: new Date()
        }, { merge: true });

        logger.info('Team upgraded successfully', { teamCode });
        return { success: true };

    } catch (error) {
        logger.error('Upgrade error', { message: error.message });
        throw new AppError('Failed to verify upgrade', 500);
    }
};

module.exports = { createCheckoutSession, upgradeToPro };