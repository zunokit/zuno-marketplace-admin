/**
 * Generic Try/Catch Error Handling Utilities
 *
 * @module try-catch
 * @description Provides generic, type-safe error handling wrappers for async and sync operations.
 * These utilities eliminate boilerplate try-catch blocks and provide consistent error handling
 * across the application.
 *
 * Key Features:
 * - Type-safe error handling with discriminated unions
 * - Optional fallback values for graceful degradation
 * - Automatic logging with configurable log levels
 * - Support for validation and transformation pipelines
 * - Zero runtime overhead in happy path
 *
 * @example
 * ```typescript
 * // Basic usage with fallback
 * const result = await withErrorHandling(
 *   async () => fetchUserData(userId),
 *   { context: 'fetchUserData', fallback: null }
 * )
 * if (result.success) {
 *   console.log(result.data) // Type-safe access
 * }
 *
 * // Server Action wrapper
 * export async function getUserAction(userId: string) {
 *   return withServerAction(
 *     async () => getUserUseCase.execute(userId),
 *     'getUserAction'
 *   )
 * }
 * ```
 */

import { logger } from './logger'
import { AppError } from './error-handler'
import { serverActionSuccess, serverActionError, type ServerActionResponse } from './api-response'

/**
 * Discriminated union type for operation results
 * Enables type-safe error handling without throwing exceptions
 *
 * @template T - The type of the successful result data
 *
 * @example
 * ```typescript
 * const result: TryResult<User> = await safeTry(() => getUser(id))
 * if (result.success) {
 *   // TypeScript knows result.data is User
 *   console.log(result.data.name)
 * } else {
 *   // TypeScript knows result.error exists
 *   console.error(result.error)
 * }
 * ```
 */
export type TryResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: Error | AppError | unknown }

/**
 * Generic error handling wrapper with configurable options
 * The foundation for all other error handling utilities
 *
 * @template T - The return type of the operation
 * @param operation - Async function to execute
 * @param options - Configuration options
 * @param options.context - Context string for logging (e.g., function name)
 * @param options.fallback - Fallback value to return on error (makes success: true)
 * @param options.shouldLog - Whether to log errors (default: true)
 * @param options.logLevel - Log level for errors: 'error' or 'warn' (default: 'error')
 * @returns TryResult with success flag and data or error
 *
 * @example
 * ```typescript
 * // With fallback value (always returns success)
 * const result = await withErrorHandling(
 *   async () => db.query.user.findFirst({ where: eq(users.id, userId) }),
 *   {
 *     context: 'getUserById',
 *     fallback: null, // Return null instead of error
 *     shouldLog: true,
 *   }
 * )
 * const user = result.data // null if error occurred
 *
 * // Without fallback (can return error)
 * const result = await withErrorHandling(
 *   async () => criticalOperation(),
 *   { context: 'criticalOperation' }
 * )
 * if (!result.success) {
 *   // Handle error
 *   throw new AppError('Critical operation failed', 500)
 * }
 * ```
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
    // Log error if enabled
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

    // Return fallback value if provided (success case)
    if (fallback !== undefined) {
      return { success: true, data: fallback };
    }

    // Return error case
    return { success: false, error };
  }
}

/**
 * Server Action wrapper with consistent error handling
 * Converts TryResult to Next.js Server Action response format
 *
 * @template T - The return type of the server action
 * @param operation - Async server action operation
 * @param context - Context string for logging
 * @returns ServerActionResponse with success flag and data or error
 *
 * @example
 * ```typescript
 * // In a Server Action file
 * 'use server'
 *
 * export async function createUserAction(data: CreateUserInput) {
 *   return withServerAction(
 *     async () => {
 *       const validated = validateUser(data)
 *       return await createUserUseCase.execute(validated)
 *     },
 *     'createUserAction'
 *   )
 * }
 *
 * // In a component
 * const result = await createUserAction(formData)
 * if (result.success) {
 *   toast.success('User created!')
 *   router.push(`/users/${result.data.id}`)
 * } else {
 *   toast.error(result.error)
 * }
 * ```
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
 * Simplified wrapper for safe async operations
 * Convenience function that wraps withErrorHandling with simpler API
 *
 * @template T - The return type of the operation
 * @param operation - Async function to execute
 * @param context - Context string for logging
 * @param fallbackValue - Optional fallback value on error
 * @returns TryResult with success flag and data or error
 *
 * @example
 * ```typescript
 * // Without fallback - check success manually
 * const result = await safeTry(
 *   async () => fetchUserPreferences(userId),
 *   'fetchUserPreferences'
 * )
 * if (result.success) {
 *   return result.data
 * } else {
 *   return defaultPreferences
 * }
 *
 * // With fallback - always succeeds
 * const result = await safeTry(
 *   async () => fetchUserPreferences(userId),
 *   'fetchUserPreferences',
 *   defaultPreferences
 * )
 * return result.data // Always has value
 * ```
 */
export async function safeTry<T>(
  operation: () => Promise<T>,
  context?: string,
  fallbackValue?: T
): Promise<TryResult<T>> {
  return withErrorHandling(operation, { context, fallback: fallbackValue });
}

/**
 * Execute async operation with post-operation validation
 * Useful for runtime type checking and business rule validation
 *
 * @template T - The return type of the operation
 * @param operation - Async function to execute
 * @param validator - Function to validate the result (returns true if valid)
 * @param errorMessage - Error message if validation fails
 * @param context - Context string for logging
 * @returns TryResult with success flag and data or error
 *
 * @example
 * ```typescript
 * // Validate API response structure
 * const result = await tryValidate(
 *   async () => fetch('/api/user').then(r => r.json()),
 *   (data): data is User => {
 *     return typeof data.id === 'string' && typeof data.email === 'string'
 *   },
 *   'Invalid user data received from API',
 *   'fetchUser'
 * )
 *
 * // Validate business rules
 * const result = await tryValidate(
 *   async () => calculateDiscount(order),
 *   (discount) => discount >= 0 && discount <= 100,
 *   'Discount must be between 0 and 100',
 *   'calculateDiscount'
 * )
 * ```
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
 * Safe data transformation pipeline
 * Executes an async operation and then transforms the result
 * Both steps are error-handled independently
 *
 * @template T - The return type of the initial operation
 * @template R - The return type after transformation
 * @param operation - Async function to fetch/compute initial data
 * @param transformer - Sync function to transform the data
 * @param context - Context string for logging
 * @returns TryResult with transformed data or error
 *
 * @example
 * ```typescript
 * // Transform API response to domain model
 * const result = await safeTransform(
 *   async () => fetch('/api/users').then(r => r.json()),
 *   (apiData) => apiData.map(user => new UserEntity(user)),
 *   'fetchAndTransformUsers'
 * )
 *
 * // Transform and normalize data
 * const result = await safeTransform(
 *   async () => getUserStats(userId),
 *   (stats) => ({
 *     ...stats,
 *     percentage: (stats.completed / stats.total) * 100
 *   }),
 *   'getUserStatsWithPercentage'
 * )
 * ```
 */
export async function safeTransform<T, R>(
  operation: () => Promise<T>,
  transformer: (data: T) => R,
  context?: string
): Promise<TryResult<R>> {
  // Execute async operation
  const result = await withErrorHandling(operation, { context });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Execute sync transformation
  const transformResult = runSafely(() => transformer(result.data), context);
  if (!transformResult.success) {
    logger.error(
      `Transform step failed${context ? ` in ${context}` : ''}`,
      transformResult.error instanceof Error ? transformResult.error.message : String(transformResult.error)
    );
    return { success: false, error: transformResult.error };
  }

  return { success: true, data: transformResult.data };
}

/**
 * Synchronous operation wrapper with error handling
 * For operations that execute synchronously but may throw
 *
 * @template T - The return type of the operation
 * @param operation - Sync function to execute
 * @param context - Context string for logging
 * @returns TryResult with success flag and data or error
 *
 * @example
 * ```typescript
 * // Safe JSON parsing
 * const result = runSafely(
 *   () => JSON.parse(jsonString),
 *   'parseUserConfig'
 * )
 * if (result.success) {
 *   return result.data
 * } else {
 *   return defaultConfig
 * }
 *
 * // Safe array operations
 * const result = runSafely(
 *   () => items.find(item => item.id === searchId)!,
 *   'findItemById'
 * )
 * ```
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