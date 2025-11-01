/**
 * Logger Utility Tests
 * Tests for centralized logging system
 */

import { logger } from '../logger'

// Mock console methods
const originalConsole = { ...console }
const mockConsole = {
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}

describe('Logger Utility', () => {
  beforeEach(() => {
    // Replace console methods with mocks
    global.console = mockConsole as unknown as Console
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Restore original console
    global.console = originalConsole
  })

  describe('log levels', () => {
    it('should log info messages', () => {
      logger.info('Test info message')

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('Test info message')
      )
    })

    it('should log warn messages', () => {
      logger.warn('Test warning message')

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        expect.stringContaining('Test warning message')
      )
    })

    it('should log error messages', () => {
      logger.error('Test error message')

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('Test error message')
      )
    })

    it('should log debug messages', () => {
      logger.debug('Test debug message')

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.stringContaining('Test debug message')
      )
    })
  })

  describe('context data', () => {
    it('should log with context object', () => {
      logger.info('User login', { userId: '123', email: 'test@example.com' })

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('User login'),
        expect.objectContaining({ userId: '123', email: 'test@example.com' })
      )
    })

    it('should handle empty context', () => {
      logger.info('Message without context', {})

      expect(mockConsole.info).toHaveBeenCalled()
    })

    it('should handle null context', () => {
      logger.info('Message with null context', null as unknown as Record<string, unknown>)

      expect(mockConsole.info).toHaveBeenCalled()
    })

    it('should handle complex context objects', () => {
      const context = {
        user: { id: '123', name: 'Test User' },
        action: 'delete',
        metadata: { timestamp: Date.now() },
      }

      logger.info('Complex context', context)

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining(context)
      )
    })
  })

  describe('timestamp', () => {
    it('should include timestamp in log output', () => {
      logger.info('Test message')

      const call = mockConsole.info.mock.calls[0][0] as string
      // Check for ISO timestamp format
      expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('message formatting', () => {
    it('should handle string messages', () => {
      logger.info('Simple string message')

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Simple string message')
      )
    })

    it('should handle empty messages', () => {
      logger.info('')

      expect(mockConsole.info).toHaveBeenCalled()
    })

    it('should handle special characters', () => {
      logger.info('Special: !@#$%^&*()')

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Special: !@#$%^&*()')
      )
    })

    it('should handle unicode messages', () => {
      logger.info('Unicode: 你好世界 مرحبا')

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Unicode: 你好世界 مرحبا')
      )
    })
  })

  describe('error logging', () => {
    it('should log Error objects', () => {
      const error = new Error('Test error')
      logger.error('Error occurred', { error })

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ error })
      )
    })

    it('should log error stack traces', () => {
      const error = new Error('Test error')
      logger.error('Error with stack', { error, stack: error.stack })

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ error })
      )
    })

    it('should handle custom error objects', () => {
      const customError = {
        message: 'Custom error',
        code: 'ERR_CUSTOM',
        details: { field: 'email' },
      }

      logger.error('Custom error occurred', customError)

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining(customError)
      )
    })
  })

  describe('performance and edge cases', () => {
    it('should handle multiple rapid calls', () => {
      for (let i = 0; i < 100; i++) {
        logger.info(`Message ${i}`)
      }

      expect(mockConsole.info).toHaveBeenCalledTimes(100)
    })

    it('should handle very long messages', () => {
      const longMessage = 'a'.repeat(10000)
      logger.info(longMessage)

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(longMessage)
      )
    })

    it('should handle large context objects', () => {
      const largeContext = {}
      for (let i = 0; i < 100; i++) {
        // @ts-expect-error - Building large object for testing
        largeContext[`key${i}`] = `value${i}`
      }

      logger.info('Large context', largeContext)

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining(largeContext)
      )
    })

    it('should not fail on circular references in context', () => {
      const circular: Record<string, unknown> = { name: 'test' }
      circular.self = circular

      // Should handle gracefully (might stringify or truncate)
      expect(() => logger.info('Circular reference', circular)).not.toThrow()
    })
  })

  describe('environment-specific behavior', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('should work in test environment', () => {
      process.env.NODE_ENV = 'test'

      logger.info('Test environment message')

      expect(mockConsole.info).toHaveBeenCalled()
    })

    it('should work in development environment', () => {
      process.env.NODE_ENV = 'development'

      logger.info('Development message')

      expect(mockConsole.info).toHaveBeenCalled()
    })

    it('should work in production environment', () => {
      process.env.NODE_ENV = 'production'

      logger.info('Production message')

      expect(mockConsole.info).toHaveBeenCalled()
    })
  })
})
