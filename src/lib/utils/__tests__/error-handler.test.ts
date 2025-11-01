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
  asyncErrorHandler,
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

  describe('errorHandler (sync)', () => {
    it('should execute function and return result on success', () => {
      const fn = () => 'success'
      const result = errorHandler(fn, 'testOperation')

      expect(result).toBe('success')
    })

    it('should handle custom AppError and preserve it', () => {
      const fn = () => {
        throw new ValidationError('Invalid data')
      }

      expect(() => errorHandler(fn, 'testOperation')).toThrow(ValidationError)
      expect(() => errorHandler(fn, 'testOperation')).toThrow('Invalid data')
    })

    it('should wrap generic Error in AppError', () => {
      const fn = () => {
        throw new Error('Generic error')
      }

      expect(() => errorHandler(fn, 'testOperation')).toThrow(AppError)
      expect(() => errorHandler(fn, 'testOperation')).toThrow('Generic error')
    })

    it('should handle string errors', () => {
      const fn = () => {
        throw 'String error'
      }

      expect(() => errorHandler(fn, 'testOperation')).toThrow(AppError)
      expect(() => errorHandler(fn, 'testOperation')).toThrow('String error')
    })

    it('should handle unknown error types', () => {
      const fn = () => {
        throw { custom: 'object' }
      }

      expect(() => errorHandler(fn, 'testOperation')).toThrow(AppError)
      expect(() => errorHandler(fn, 'testOperation')).toThrow('An unexpected error occurred')
    })

    it('should handle null and undefined errors', () => {
      const fn1 = () => {
        throw null
      }
      const fn2 = () => {
        throw undefined
      }

      expect(() => errorHandler(fn1, 'testOperation')).toThrow(AppError)
      expect(() => errorHandler(fn2, 'testOperation')).toThrow(AppError)
    })
  })

  describe('asyncErrorHandler', () => {
    it('should execute async function and return result on success', async () => {
      const fn = async () => 'async success'
      const result = await asyncErrorHandler(fn, 'testOperation')

      expect(result).toBe('async success')
    })

    it('should handle rejected promises', async () => {
      const fn = async () => {
        throw new Error('Async error')
      }

      await expect(asyncErrorHandler(fn, 'testOperation')).rejects.toThrow(AppError)
      await expect(asyncErrorHandler(fn, 'testOperation')).rejects.toThrow('Async error')
    })

    it('should handle custom errors in async context', async () => {
      const fn = async () => {
        throw new NotFoundError('Resource not found')
      }

      await expect(asyncErrorHandler(fn, 'testOperation')).rejects.toThrow(NotFoundError)
      await expect(asyncErrorHandler(fn, 'testOperation')).rejects.toThrow('Resource not found')
    })

    it('should handle async/await errors', async () => {
      const fn = async () => {
        await Promise.reject(new Error('Rejection'))
      }

      await expect(asyncErrorHandler(fn, 'testOperation')).rejects.toThrow(AppError)
    })
  })

  describe('sanitizeError', () => {
    it('should sanitize AppError for client', () => {
      const error = new ValidationError('Invalid input')
      const sanitized = sanitizeError(error)

      expect(sanitized.message).toBe('Invalid input')
      expect(sanitized.statusCode).toBe(400)
      expect(sanitized.isOperational).toBe(true)
    })

    it('should sanitize generic Error with safe message', () => {
      const error = new Error('Internal database connection failed')
      const sanitized = sanitizeError(error)

      expect(sanitized.message).toBe('Internal database connection failed')
      expect(sanitized.statusCode).toBe(500)
      expect(sanitized.isOperational).toBe(false)
    })

    it('should handle string errors', () => {
      const sanitized = sanitizeError('Something went wrong')

      expect(sanitized.message).toBe('Something went wrong')
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

    it('should mark operational errors correctly', () => {
      const appError = new AppError('App error', 400)
      const genericError = new Error('Generic error')

      expect(sanitizeError(appError).isOperational).toBe(true)
      expect(sanitizeError(genericError).isOperational).toBe(false)
    })
  })

  describe('Error context and metadata', () => {
    it('should maintain error context through handler', () => {
      const error = new ValidationError('Invalid email format')

      const fn = () => {
        throw error
      }

      try {
        errorHandler(fn, 'validateEmail')
      } catch (e) {
        expect(e).toBe(error)
        expect((e as ValidationError).statusCode).toBe(400)
      }
    })

    it('should handle errors with additional properties', () => {
      const error = new ValidationError('Validation failed')
      // @ts-expect-error - Adding custom property for testing
      error.field = 'email'
      // @ts-expect-error - Adding custom property for testing
      error.value = 'invalid-email'

      const fn = () => {
        throw error
      }

      try {
        errorHandler(fn, 'testOperation')
      } catch (e) {
        expect(e).toBe(error)
        // @ts-expect-error - Checking custom property
        expect(e.field).toBe('email')
      }
    })
  })
})
