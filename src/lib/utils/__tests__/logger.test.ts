/**
 * Logger Utility Tests
 * Tests for centralized logging system
 * Note: We test that logger methods don't throw errors, not console output
 */

import { logger } from '../logger'

describe('Logger Utility', () => {

  describe('log levels', () => {
    it('should log info messages without throwing', () => {
      expect(() => logger.info('Test info message')).not.toThrow()
    })

    it('should log warn messages without throwing', () => {
      expect(() => logger.warn('Test warning message')).not.toThrow()
    })

    it('should log error messages without throwing', () => {
      expect(() => logger.error('Test error message')).not.toThrow()
    })

    it('should log debug messages without throwing', () => {
      expect(() => logger.debug('Test debug message')).not.toThrow()
    })
  })

  describe('context data', () => {
    it('should log with context object without throwing', () => {
      expect(() => {
        logger.info('User login', { userId: '123', email: 'test@example.com' })
      }).not.toThrow()
    })

    it('should handle empty context without throwing', () => {
      expect(() => logger.info('Message without context', {})).not.toThrow()
    })

    it('should handle null context without throwing', () => {
      expect(() => {
        logger.info('Message with null context', null as unknown as Record<string, unknown>)
      }).not.toThrow()
    })

    it('should handle complex context objects without throwing', () => {
      const context = {
        user: { id: '123', name: 'Test User' },
        action: 'delete',
        metadata: { timestamp: Date.now() },
      }

      expect(() => logger.info('Complex context', context)).not.toThrow()
    })
  })

  describe('timestamp', () => {
    it('should handle messages with timestamps without throwing', () => {
      expect(() => logger.info('Test message')).not.toThrow()
    })
  })

  describe('message formatting', () => {
    it('should handle string messages without throwing', () => {
      expect(() => logger.info('Simple string message')).not.toThrow()
    })

    it('should handle empty messages without throwing', () => {
      expect(() => logger.info('')).not.toThrow()
    })

    it('should handle special characters without throwing', () => {
      expect(() => logger.info('Special: !@#$%^&*()')).not.toThrow()
    })

    it('should handle unicode messages without throwing', () => {
      expect(() => logger.info('Unicode: 你好世界 مرحبا')).not.toThrow()
    })
  })

  describe('error logging', () => {
    it('should log Error objects without throwing', () => {
      const error = new Error('Test error')
      expect(() => logger.error('Error occurred', { error })).not.toThrow()
    })

    it('should log error stack traces without throwing', () => {
      const error = new Error('Test error')
      expect(() => {
        logger.error('Error with stack', { error, stack: error.stack })
      }).not.toThrow()
    })

    it('should handle custom error objects without throwing', () => {
      const customError = {
        message: 'Custom error',
        code: 'ERR_CUSTOM',
        details: { field: 'email' },
      }

      expect(() => logger.error('Custom error occurred', customError)).not.toThrow()
    })
  })

  describe('performance and edge cases', () => {
    it('should handle multiple rapid calls without throwing', () => {
      expect(() => {
        for (let i = 0; i < 100; i++) {
          logger.info(`Message ${i}`)
        }
      }).not.toThrow()
    })

    it('should handle very long messages without throwing', () => {
      const longMessage = 'a'.repeat(10000)
      expect(() => logger.info(longMessage)).not.toThrow()
    })

    it('should handle large context objects without throwing', () => {
      const largeContext = {}
      for (let i = 0; i < 100; i++) {
        // @ts-expect-error - Building large object for testing
        largeContext[`key${i}`] = `value${i}`
      }

      expect(() => logger.info('Large context', largeContext)).not.toThrow()
    })

    it('should not fail on circular references in context', () => {
      const circular: Record<string, unknown> = { name: 'test' }
      circular.self = circular

      expect(() => logger.info('Circular reference', circular)).not.toThrow()
    })
  })

  describe('environment-specific behavior', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true })
    })

    it('should work in test environment without throwing', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true })
      expect(() => logger.info('Test environment message')).not.toThrow()
    })

    it('should work in development environment without throwing', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true })
      expect(() => logger.info('Development message')).not.toThrow()
    })

    it('should work in production environment without throwing', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })
      expect(() => logger.info('Production message')).not.toThrow()
    })
  })
})
