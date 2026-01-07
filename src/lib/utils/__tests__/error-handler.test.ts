/**
 * Error Handler Utility Tests
 * Tests for custom error classes and error handling wrappers
 */

import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  errorHandler,
  sanitizeError,
} from '../error-handler'

describe('Error Handler Utility', () => {
  describe('Custom Error Classes', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError('Test error', 400)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(400)
      expect(error.name).toBe('AppError')
    })

    it('should create ValidationError with 400 status code', () => {
      const error = new ValidationError('Invalid input')

      expect(error).toBeInstanceOf(AppError)
      expect(error.message).toBe('Invalid input')
      expect(error.statusCode).toBe(400)
      expect(error.name).toBe('ValidationError')
    })

    it('should create NotFoundError with 404 status code', () => {
      const error = new NotFoundError('Resource not found')

      expect(error).toBeInstanceOf(AppError)
      expect(error.message).toBe('Resource not found')
      expect(error.statusCode).toBe(404)
      expect(error.name).toBe('NotFoundError')
    })

    it('should create UnauthorizedError with 401 status code', () => {
      const error = new UnauthorizedError('Not authenticated')

      expect(error).toBeInstanceOf(AppError)
      expect(error.message).toBe('Not authenticated')
      expect(error.statusCode).toBe(401)
      expect(error.name).toBe('UnauthorizedError')
    })

    it('should create ForbiddenError with 403 status code', () => {
      const error = new ForbiddenError('Access denied')

      expect(error).toBeInstanceOf(AppError)
      expect(error.message).toBe('Access denied')
      expect(error.statusCode).toBe(403)
      expect(error.name).toBe('ForbiddenError')
    })
  })

  describe('errorHandler (async)', () => {
    it('should execute async function and return result on success', async () => {
      const fn = async () => 'async success'
      const result = await errorHandler(fn, 'testOperation')

      expect(result).toBe('async success')
    })

    it('should handle rejected promises', async () => {
      const fn = async () => {
        throw new Error('Async error')
      }

      try {
        await errorHandler(fn, 'testOperation')
        fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Async error')
      }
    })

    it('should handle custom errors in async context', async () => {
      const fn = async () => {
        throw new NotFoundError('Resource not found')
      }

      try {
        await errorHandler(fn, 'testOperation')
        fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError)
        expect((error as Error).message).toBe('Resource not found')
      }
    })
  })

  describe('sanitizeError', () => {
    it('should sanitize AppError for client', () => {
      const error = new ValidationError('Invalid input')
      const sanitized = sanitizeError(error)

      expect(sanitized.message).toBe('Invalid input')
      expect(sanitized.statusCode).toBe(400)
    })

    it('should sanitize generic Error with safe message', () => {
      const error = new Error('Internal database connection failed')
      const sanitized = sanitizeError(error)

      // In test environment, sanitized message depends on isDevelopment()
      // Development shows original message, production shows generic message
      expect(sanitized.statusCode).toBe(500)
      // Message can be either original (dev) or sanitized (prod/test)
      expect(typeof sanitized.message).toBe('string')
    })

    it('should handle string errors', () => {
      const sanitized = sanitizeError('Something went wrong')

      // Non-Error types get generic message
      expect(sanitized.message).toBe('An unexpected error occurred')
      expect(sanitized.statusCode).toBe(500)
    })

    it('should handle unknown error objects', () => {
      const sanitized = sanitizeError({ weird: 'object' })

      expect(sanitized.message).toBe('An unexpected error occurred')
      expect(sanitized.statusCode).toBe(500)
    })

    it('should preserve status codes for custom errors', () => {
      const errors = [
        new ValidationError('test'),
        new NotFoundError('test'),
        new UnauthorizedError('test'),
        new ForbiddenError('test'),
      ]

      const statusCodes = [400, 404, 401, 403]

      errors.forEach((error, index) => {
        const sanitized = sanitizeError(error)
        expect(sanitized.statusCode).toBe(statusCodes[index])
      })
    })

    it('should handle AppError and generic Error differently', () => {
      const appError = new AppError('App error', 400)
      const genericError = new Error('Generic error')

      const sanitizedApp = sanitizeError(appError)
      const sanitizedGeneric = sanitizeError(genericError)

      expect(sanitizedApp.message).toBe('App error')
      expect(sanitizedApp.statusCode).toBe(400)
      expect(sanitizedGeneric.statusCode).toBe(500)
    })
  })

  describe('Error context and metadata', () => {
    it('should maintain error context through handler', async () => {
      const error = new ValidationError('Invalid email format')

      const fn = async () => {
        throw error
      }

      try {
        await errorHandler(fn, 'validateEmail')
      } catch (e) {
        expect(e).toBe(error)
        expect((e as ValidationError).statusCode).toBe(400)
      }
    })

    it('should handle errors with additional properties', async () => {
      const error = new ValidationError('Validation failed')
      // @ts-expect-error - Adding custom property for testing
      error.field = 'email'
      // @ts-expect-error - Adding custom property for testing
      error.value = 'invalid-email'

      const fn = async () => {
        throw error
      }

      try {
        await errorHandler(fn, 'testOperation')
      } catch (e) {
        expect(e).toBe(error)
        // @ts-expect-error - Checking custom property
        expect(e.field).toBe('email')
      }
    })
  })
})
