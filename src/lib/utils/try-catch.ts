/**
 * Generic Try/Catch Utility
 * Clean, reusable error handling wrapper for async operations using a single generic function
 */

import { logger } from './logger'
import { AppError, sanitizeError } from './error-handler'
import { serverActionSuccess, serverActionError, type ServerActionResponse } from './api-response'

/**
 * Result type for safe async operations
 */
export type TryResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: Error | AppError | unknown }

/**
 * Generic error handling function with type parameter
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options: {
    context?: string;
    fallback?: T;
    shouldLog?: boolean;
    logLevel?: 'error' | 'warn';
  } = {}
): Promise<TryResult<T>> {
  const { context, fallback, shouldLog = true, logLevel = 'error' } = options;
  
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    if (shouldLog) {
      if (logLevel === 'error') {
        logger.error(
          `Operation failed${context ? ` in ${context}` : ''}`,
          error instanceof Error ? error.message : String(error)
        );
      } else {
        logger.warn(
          `Operation failed${context ? ` in ${context}` : ''}`,
          { error: error instanceof Error ? error.message : String(error), context }
        );
      }
    }

    if (fallback !== undefined) {
      return { success: true, data: fallback };
    }

    return { success: false, error };
  }
}

/**
 * Server Action wrapper with consistent error handling
 */
export async function withServerAction<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<ServerActionResponse<T>> {
  const result = await withErrorHandling(operation, { context });
  
  if (result.success) {
    return serverActionSuccess(result.data);
  } else {
    return serverActionError(result.error);
  }
}

/**
 * Safe async operation wrapper
 */
export async function safeTry<T>(
  operation: () => Promise<T>,
  context?: string,
  fallbackValue?: T
): Promise<TryResult<T>> {
  return withErrorHandling(operation, { context, fallback: fallbackValue });
}

/**
 * Async operation with validation
 */
export async function tryValidate<T>(
  operation: () => Promise<T>,
  validator: (data: T) => boolean,
  errorMessage: string = 'Validation failed',
  context?: string
): Promise<TryResult<T>> {
  try {
    const data = await operation();
    
    if (!validator(data)) {
      const error = new Error(errorMessage);
      logger.error(
        `Validation failed${context ? ` in ${context}` : ''}`,
        error.message
      );
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error(
      `Validated operation failed${context ? ` in ${context}` : ''}`,
      error instanceof Error ? error.message : String(error)
    );
    return { success: false, error };
  }
}

/**
 * Safe transformation with type guard
 */
export async function safeTransform<T, R>(
  operation: () => Promise<T>,
  transformer: (data: T) => R,
  context?: string
): Promise<TryResult<R>> {
  const result = await withErrorHandling(operation, { context });
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  const transformResult = runSafely(() => transformer(result.data), context);
  if (!transformResult.success) {
    logger.error(
      `Safe transform failed${context ? ` in ${context}` : ''}`,
      transformResult.error instanceof Error ? transformResult.error.message : String(transformResult.error)
    );
    return { success: false, error: transformResult.error };
  }
  
  return { success: true, data: transformResult.data };
}

/**
 * Type-safe operation with expected return type
 */
export function runSafely<T>(
  operation: () => T,
  context?: string
): TryResult<T> {
  try {
    const result = operation();
    return { success: true, data: result };
  } catch (error) {
    logger.error(
      `Sync operation failed${context ? ` in ${context}` : ''}`,
      error instanceof Error ? error.message : String(error)
    );
    return { success: false, error };
  }
}