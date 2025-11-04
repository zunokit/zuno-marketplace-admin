/**
 * Error Handler Utility
 * Centralized error handling wrapper for try-catch blocks
 * Sanitizes errors before exposing to clients
 */

import { logger } from './logger'

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

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, true, context)
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', context?: Record<string, unknown>) {
    super(message, 401, true, context)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', context?: Record<string, unknown>) {
    super(message, 403, true, context)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', context?: Record<string, unknown>) {
    super(message, 404, true, context)
    this.name = 'NotFoundError'
  }
}

/**
 * Sanitize error for client response
 * Never expose internal error details to clients
 */
export function sanitizeError(error: unknown): {
  message: string
  statusCode: number
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    }
  }

  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const { isDevelopment } = require('./environment')
    const message = isDevelopment()
      ? error.message
      : 'An unexpected error occurred'

    return {
      message,
      statusCode: 500,
    }
  }

  return {
    message: 'An unexpected error occurred',
    statusCode: 500,
  }
}

/**
 * Error handler wrapper for async functions
 * Automatically logs errors and sanitizes them
 */
export async function errorHandler<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    logger.error(
      `Error in ${context || 'operation'}`,
      error,
      error instanceof AppError ? error.context : undefined
    )
    throw error
  }
}

/**
 * Error handler wrapper for sync functions
 */
export function errorHandlerSync<T>(
  fn: () => T,
  context?: string
): T {
  try {
    return fn()
  } catch (error) {
    logger.error(
      `Error in ${context || 'operation'}`,
      error,
      error instanceof AppError ? error.context : undefined
    )
    throw error
  }
}
