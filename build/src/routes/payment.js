"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = __importDefault(require("../utils/logger"));
const paymentService_1 = require("../services/paymentService");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/api/create-checkout-session', auth_1.verifyToken, validate_1.validateTeamCode, async (req, res, next) => {
    try {
        const { teamCode } = req.body;
        // Cast req to 'any' to access the user object injected by verifyToken middleware
        const uid = req.user?.uid || 'anonymous';
        logger_1.default.info('Checkout session requested', {
            teamCode,
            uid
        });
        // req.headers.origin can be undefined, so we provide a safe fallback or cast it
        const origin = req.headers.origin || 'http://localhost:5173';
        const url = await (0, paymentService_1.createCheckoutSession)(teamCode, origin);
        return res.json({ url });
    }
    catch (error) {
        next(error);
    }
});
router.post('/api/verify-upgrade', auth_1.verifyToken, validate_1.validateTeamCode, async (req, res, next) => {
    try {
        const { teamCode } = req.body;
        const uid = req.user?.uid || 'anonymous';
        logger_1.default.info('Upgrade verification requested', {
            teamCode,
            uid
        });
        const db = req.app.locals.db;
        const result = await (0, paymentService_1.upgradeToPro)(db, teamCode);
        return res.json(result);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
