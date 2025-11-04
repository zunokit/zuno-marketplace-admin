/**
 * Service Error Handling Utilities
 * Utilities for error handling in services and use cases using the generic function
 */

import { logger } from '@/lib/utils/logger'
import { AppError } from '@/lib/utils/error-handler'
import { TryResult, withErrorHandling } from './try-catch'

/**
 * Execute service operation with error handling
 */
export async function withServiceOperation<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  const result = await withErrorHandling(operation, { context });
  
  if (result.success) {
    return result.data;
  } else {
    logger.error(
      `Service operation failed${context ? ` in ${context}` : ''}`,
      result.error instanceof Error ? result.error.message : String(result.error)
    );
    throw result.error; // Re-throw to maintain original behavior
  }
}

/**
 * Execute service operation with graceful error handling
 * Returns TryResult instead of throwing
 */
export async function tryServiceOperation<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<TryResult<T>> {
  return withErrorHandling(operation, { context });
}

/**
 * Execute database transaction with error handling
 */
export async function withTransaction<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  const result = await withErrorHandling(operation, { context });
  
  if (result.success) {
    return result.data;
  } else {
    logger.error(
      `Database transaction failed${context ? ` in ${context}` : ''}`,
      result.error instanceof Error ? result.error.message : String(result.error)
    );
    throw result.error; // Re-throw to maintain original behavior
  }
}

/**
 * Execute repository method with error handling
 */
export async function withRepositoryOperation<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  const result = await withErrorHandling(operation, { context });
  
  if (result.success) {
    return result.data;
  } else {
    logger.error(
      `Repository operation failed${context ? ` in ${context}` : ''}`,
      result.error instanceof Error ? result.error.message : String(result.error)
    );
    throw result.error; // Re-throw to maintain original behavior
  }
}

/**
 * Execute use case with error handling
 */
export async function withUseCase<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  const result = await withErrorHandling(operation, { context });
  
  if (result.success) {
    return result.data;
  } else {
    logger.error(
      `Use case failed${context ? ` in ${context}` : ''}`,
      result.error instanceof Error ? result.error.message : String(result.error)
    );
    
    // For use cases, we might want to convert to specific AppError types
    if (result.error instanceof AppError) {
      throw result.error;
    }
    
    throw new Error(
      `Use case failed${context ? ` in ${context}` : ''}: ${
        result.error instanceof Error ? result.error.message : String(result.error)
      }`
    );
  }
}