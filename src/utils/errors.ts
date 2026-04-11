import { Request, Response, NextFunction } from 'express';

import logger from './logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Invalid input') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message: string = 'Payment required') {
    super(message, 402);
  }
}

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if ((err as AppError).isOperational) {
    logger.warn('Operational error', {
      message: err.message,
      statusCode: (err as AppError).statusCode,
      path: req.path
    });
    res.status((err as AppError).statusCode).json({
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