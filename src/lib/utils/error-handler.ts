/**
 * Error Handler Utility
 * Centralized error classes and sanitization for error handling
 *
 * @module error-handler
 * @description Provides custom error classes for different HTTP status codes
 * and utilities for sanitizing errors before sending to clients.
 *
 * For error handling wrappers, use the generic functions in try-catch.ts:
 * - withErrorHandling: Generic async error handling with options
 * - safeTry: Safe async operation with fallback values
 * - tryValidate: Async operation with validation
 *
 * @example
 * ```typescript
 * // Throwing custom errors
 * throw new ValidationError('Invalid email format', { field: 'email' })
 * throw new UnauthorizedError('Invalid credentials')
 * throw new ForbiddenError('Insufficient permissions')
 * throw new NotFoundError('User not found')
 *
 * // Sanitizing errors for client responses
 * const sanitized = sanitizeError(error)
 * return NextResponse.json(sanitized, { status: sanitized.statusCode })
 * ```
 */

import { isDevelopment } from './environment'
import { logger } from './logger'

/**
 * Base application error class
 * All custom errors should extend this class
 *
 * @param message - Human-readable error message
 * @param statusCode - HTTP status code (default: 500)
 * @param isOperational - Whether this is an expected operational error (default: true)
 * @param context - Additional context data for debugging
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Validation error (400 Bad Request)
 * Use for invalid input data, failed validations, etc.
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, true, context)
    this.name = 'ValidationError'
  }
}

/**
 * Unauthorized error (401 Unauthorized)
 * Use when authentication is required but not provided or invalid
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', context?: Record<string, unknown>) {
    super(message, 401, true, context)
    this.name = 'UnauthorizedError'
  }
}

/**
 * Forbidden error (403 Forbidden)
 * Use when user is authenticated but lacks required permissions
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', context?: Record<string, unknown>) {
    super(message, 403, true, context)
    this.name = 'ForbiddenError'
  }
}

/**
 * Not found error (404 Not Found)
 * Use when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', context?: Record<string, unknown>) {
    super(message, 404, true, context)
    this.name = 'NotFoundError'
  }
}

/**
 * Sanitize error for client response
 * Never expose internal error details to clients in production
 *
 * @param error - The error to sanitize (unknown type for flexibility)
 * @returns Sanitized error object with message and status code
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation()
 * } catch (error) {
 *   const sanitized = sanitizeError(error)
 *   return NextResponse.json(
 *     { error: sanitized.message },
 *     { status: sanitized.statusCode }
 *   )
 * }
 * ```
 */
export function sanitizeError(error: unknown): {
  message: string
  statusCode: number
} {
  // AppError instances are safe to expose (they're designed for clients)
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    }
  }

  // Regular Error instances: hide details in production
  if (error instanceof Error) {
    const message = isDevelopment()
      ? error.message
      : 'An unexpected error occurred'

    return {
      message,
      statusCode: 500,
    }
  }

  // Unknown error types: always use generic message
  return {
    message: 'An unexpected error occurred',
    statusCode: 500,
  }
}

/**
 * Generic error handler wrapper for async operations
 * Executes operation and logs errors, but throws instead of returning TryResult
 * Use this when you want to handle errors at a higher level
 *
 * @param operation - Async function to execute
 * @param context - Context string for logging
 * @returns The result of the operation (throws on error)
 *
 * @example
 * ```typescript
 * const data = await errorHandler(async () => {
 *   return await fetchData()
 * }, 'fetchData')
 * // Returns data directly, or throws error
 * ```
 */
export async function errorHandler<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    // Log the error with context
    logger.error(
      `Operation failed${context ? ` in ${context}` : ''}`,
      error instanceof Error ? error : String(error)
    )
    // Re-throw the error for caller to handle
    throw error
  }
}
