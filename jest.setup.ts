import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.NODE_ENV = 'test'
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

// Silence console outputs during tests (unless debugging)
global.console = {
  ...console,
  // Keep native behaviour for other methods, use jest.fn to mock
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}
