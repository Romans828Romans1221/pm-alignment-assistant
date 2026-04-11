"use strict";
const admin = require('firebase-admin');
const logger = require('../utils/logger');
const { UnauthorizedError } = require('../utils/errors');
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided');
        }
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: decodedToken.role || 'member'
        };
        logger.info('Token verified', { uid: req.user.uid });
        next();
    }
    catch (error) {
        if (error.isOperational) {
            return next(error);
        }
        logger.warn('Invalid token', { message: error.message });
        next(new UnauthorizedError('Invalid or expired token'));
    }
};
const requireLeader = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided');
        }
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: decodedToken.role || 'member'
        };
        if (req.user.role !== 'leader') {
            logger.warn('Unauthorized leader access attempt', {
                uid: req.user.uid,
                role: req.user.role
            });
            throw new UnauthorizedError('Only team leaders can access this resource');
        }
        logger.info('Leader verified', { uid: req.user.uid });
        next();
    }
    catch (error) {
        if (error.isOperational) {
            return next(error);
        }
        logger.warn('Leader auth failed', { message: error.message });
        next(new UnauthorizedError('Invalid or expired token'));
    }
};
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: decodedToken.role || 'member'
        };
        next();
    }
    catch (error) {
        req.user = null;
        next();
    }
};
module.exports = { verifyToken, requireLeader, optionalAuth };
