const logger = require('./logger');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Invalid input') {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class PaymentRequiredError extends AppError {
  constructor(message = 'Payment required') {
    super(message, 402);
  }
}

const errorHandler = (err, req, res, next) => {
  if (err.isOperational) {
    logger.warn('Operational error', {
      message: err.message,
      statusCode: err.statusCode,
      path: req.path
    });
    return res.status(err.statusCode).json({
      error: err.message
    });
  }

  logger.error('Unexpected error', {
    message: err.message,
    stack: err.stack,
    path: req.path
  });

  return res.status(500).json({
    error: 'An unexpected error occurred'
  });
};

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  PaymentRequiredError,
  errorHandler
};