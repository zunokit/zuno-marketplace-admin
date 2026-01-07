import "@testing-library/jest-dom";

// Mock environment variables for tests
Object.defineProperty(process.env, "NODE_ENV", {
  value: "test",
  writable: true,
});
process.env.ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

// Silence console outputs during tests (unless debugging)
global.console = {
  ...console,
  // Keep native behaviour for other methods, use jest.fn to mock
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
