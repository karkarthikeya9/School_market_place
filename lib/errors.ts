export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  unauthorized: (msg = 'Authentication required') => new AppError(401, 'UNAUTHORIZED', msg),
  forbidden: (msg = 'You are not permitted to perform this action') =>
    new AppError(403, 'FORBIDDEN', msg),
  notFound: (msg = 'Resource not found') => new AppError(404, 'NOT_FOUND', msg),
  validation: (msg = 'Invalid input', details?: unknown) =>
    new AppError(422, 'VALIDATION_ERROR', msg, details),
  conflict: (msg = 'Conflict') => new AppError(409, 'CONFLICT', msg),
  rateLimited: (msg = 'Too many requests, please try again later') =>
    new AppError(429, 'RATE_LIMITED', msg),
  internal: (msg = 'Internal server error') => new AppError(500, 'INTERNAL', msg),
};
