"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upgradeToPro = exports.createCheckoutSession = void 0;
const stripe_1 = __importDefault(require("stripe"));
const logger_1 = __importDefault(require("../utils/logger"));
const errors_1 = require("../utils/errors");
// Initialize Stripe using standard TypeScript class instantiation
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '');
/**
 * Creates a Stripe checkout session for upgrading a team to Pro.
 * Returns the Stripe checkout URL as a string (or null if it fails).
 */
const createCheckoutSession = async (teamCode, origin) => {
    try {
        logger_1.default.info('Creating Stripe checkout session', { teamCode });
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
        logger_1.default.info('Stripe session created', { teamCode, sessionId: session.id });
        return session.url;
    }
    catch (error) {
        logger_1.default.error('Stripe checkout error', { message: error.message });
        throw new errors_1.AppError('Could not create checkout session', 500);
    }
};
exports.createCheckoutSession = createCheckoutSession;
/**
 * Upgrades a team to Pro status in the Firestore database.
 * Explicitly returns a success boolean object.
 */
const upgradeToPro = async (db, teamCode) => {
    try {
        logger_1.default.info('Upgrading team to Pro', { teamCode });
        await db.collection('team-usage').doc(teamCode).set({
            isPro: true,
            upgradedAt: new Date()
        }, { merge: true });
        logger_1.default.info('Team upgraded successfully', { teamCode });
        return { success: true };
    }
    catch (error) {
        logger_1.default.error('Upgrade error', { message: error.message });
        throw new errors_1.AppError('Failed to verify upgrade', 500);
    }
};
exports.upgradeToPro = upgradeToPro;
