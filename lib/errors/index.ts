/**
 * Custom Error Classes for API Routes
 *
 * These errors are caught by the error handler middleware and
 * automatically converted to appropriate HTTP responses.
 */

/**
 * Authentication error - user is not authenticated
 * Results in 401 Unauthorized response
 */
export class AuthError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message)
    this.name = 'AuthError'
    // Maintains proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError)
    }
  }
}

/**
 * Authorization error - user is authenticated but lacks permission
 * Results in 403 Forbidden response
 */
export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden - Insufficient permissions') {
    super(message)
    this.name = 'ForbiddenError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ForbiddenError)
    }
  }
}

/**
 * Resource not found error
 * Results in 404 Not Found response
 */
export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotFoundError)
    }
  }
}

/**
 * Validation error - input data is invalid
 * Results in 400 Bad Request response
 * Includes optional details for client debugging
 */
export class ValidationError extends Error {
  public details?: any

  constructor(message: string, details?: any) {
    super(message)
    this.name = 'ValidationError'
    this.details = details
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError)
    }
  }
}

/**
 * Business logic error - operation violates business rules
 * Results in 400 Bad Request response
 */
export class BusinessLogicError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BusinessLogicError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BusinessLogicError)
    }
  }
}

/**
 * Rate limit exceeded error
 * Results in 429 Too Many Requests response
 */
export class RateLimitError extends Error {
  constructor(message: string = 'Too many requests, please try again later') {
    super(message)
    this.name = 'RateLimitError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RateLimitError)
    }
  }
}

/**
 * Conflict error - resource already exists or state conflict
 * Results in 409 Conflict response
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConflictError)
    }
  }
}

/**
 * Type guard to check if error is one of our custom errors
 */
export function isCustomError(error: unknown): error is (
  AuthError | ForbiddenError | NotFoundError | ValidationError |
  BusinessLogicError | RateLimitError | ConflictError
) {
  return error instanceof AuthError ||
         error instanceof ForbiddenError ||
         error instanceof NotFoundError ||
         error instanceof ValidationError ||
         error instanceof BusinessLogicError ||
         error instanceof RateLimitError ||
         error instanceof ConflictError
}
