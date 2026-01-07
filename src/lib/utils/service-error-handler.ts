/**
 * Service Error Handler Utility
 * Provides error handling wrappers for service layer (use cases)
 *
 * @module service-error-handler
 * @description Wraps use case execution with consistent error handling and logging
 *
 * @example
 * ```typescript
 * // In a use case
 * export class CreateUserUseCase {
 *   async execute(data: CreateUserInput) {
 *     return withUseCase(async () => {
 *       // Your use case logic here
 *       return user
 *     }, 'CreateUserUseCase')
 *   }
 * }
 * ```
 */

import { logger } from './logger'
import { AppError } from './error-handler'

/**
 * Wrapper for use case execution with error handling
 * Logs errors and re-throws them for higher-level handling
 *
 * @param operation - Async use case operation to execute
 * @param useCaseName - Name of the use case for logging context
 * @returns The result of the operation (throws on error)
 *
 * @example
 * ```typescript
 * const result = await withUseCase(async () => {
 *   return await createUser(userData)
 * }, 'CreateUserUseCase')
 * ```
 */
export async function withUseCase<T>(
  operation: () => Promise<T>,
  useCaseName?: string
): Promise<T> {
  try {
    logger.debug(`Executing use case${useCaseName ? `: ${useCaseName}` : ''}`)
    const result = await operation()
    logger.debug(`Use case completed${useCaseName ? `: ${useCaseName}` : ''}`)
    return result
  } catch (error) {
    // Log the error with use case context
    const errorMessage = error instanceof Error ? error.message : String(error)
    const statusCode = error instanceof AppError ? error.statusCode : 500

    logger.error(
      `Use case failed${useCaseName ? `: ${useCaseName}` : ''}`,
      {
        error: errorMessage,
        statusCode,
        useCaseName,
      }
    )

    // Re-throw the error for caller to handle
    throw error
  }
}
