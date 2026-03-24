const {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  PaymentRequiredError
} = require('../src/utils/errors');

describe('Custom error classes', () => {

  test('AppError has correct message and statusCode', () => {
    const err = new AppError('Something went wrong', 500);
    expect(err.message).toBe('Something went wrong');
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);
  });

  test('NotFoundError defaults to 404', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.isOperational).toBe(true);
  });

  test('NotFoundError accepts custom message', () => {
    const err = new NotFoundError('Team not found');
    expect(err.message).toBe('Team not found');
    expect(err.statusCode).toBe(404);
  });

  test('ValidationError defaults to 400', () => {
    const err = new ValidationError();
    expect(err.statusCode).toBe(400);
    expect(err.isOperational).toBe(true);
  });

  test('UnauthorizedError defaults to 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.isOperational).toBe(true);
  });

  test('PaymentRequiredError defaults to 402', () => {
    const err = new PaymentRequiredError();
    expect(err.statusCode).toBe(402);
    expect(err.isOperational).toBe(true);
  });

  test('all errors are instances of Error', () => {
    expect(new AppError('test', 500)).toBeInstanceOf(Error);
    expect(new NotFoundError()).toBeInstanceOf(Error);
    expect(new ValidationError()).toBeInstanceOf(Error);
    expect(new UnauthorizedError()).toBeInstanceOf(Error);
    expect(new PaymentRequiredError()).toBeInstanceOf(Error);
  });

});