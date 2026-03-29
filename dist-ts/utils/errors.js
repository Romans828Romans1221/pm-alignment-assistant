"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.PaymentRequiredError = exports.UnauthorizedError = exports.ValidationError = exports.NotFoundError = exports.AppError = void 0;
const logger = require('./logger');
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends AppError {
    constructor(message = 'Invalid input') {
        super(message, 400);
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class PaymentRequiredError extends AppError {
    constructor(message = 'Payment required') {
        super(message, 402);
    }
}
exports.PaymentRequiredError = PaymentRequiredError;
const errorHandler = (err, req, res, next) => {
    if (err.isOperational) {
        logger.warn('Operational error', {
            message: err.message,
            statusCode: err.statusCode,
            path: req.path
        });
        res.status(err.statusCode).json({
            error: err.message
        });
        return;
    }
    logger.error('Unexpected error', {
        message: err.message,
        stack: err.stack,
        path: req.path
    });
    res.status(500).json({
        error: 'An unexpected error occurred'
    });
};
exports.errorHandler = errorHandler;
