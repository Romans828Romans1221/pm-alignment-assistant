const { body, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const messages = errors.array().map(e => e.msg).join(', ');
        logger.warn('Validation failed', { path: req.path, errors: messages });
        throw new ValidationError(messages);
    }
    next();
};

const validateAlignmentCheck = [
    body('teamCode')
        .trim()
        .notEmpty().withMessage('Team code is required')
        .isLength({ max: 50 }).withMessage('Team code too long'),

    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 100 }).withMessage('Name too long'),

    body('understanding')
        .trim()
        .notEmpty().withMessage('Understanding is required')
        .isLength({ min: 10, max: 2000 })
        .withMessage('Understanding must be between 10 and 2000 characters'),

    body('role')
        .trim()
        .notEmpty().withMessage('Role is required')
        .isLength({ max: 100 }).withMessage('Role must be under 100 characters'),

    handleValidationErrors
];

const validateTeamCode = [
    body('teamCode')
        .trim()
        .notEmpty().withMessage('Team code is required')
        .isLength({ max: 50 }).withMessage('Team code too long'),

    handleValidationErrors
];

module.exports = {
    validateAlignmentCheck,
    validateTeamCode,
    handleValidationErrors
};