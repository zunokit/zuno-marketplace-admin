/**
 * Environment Utility Functions
 * Centralized environment checks - never check process.env.NODE_ENV directly
 */

/**
 * Check if running in development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in test environment
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test'
}

/**
 * Check if running on server side
 */
export function isServer(): boolean {
  return typeof window === 'undefined'
}

/**
 * Check if running on client side
 */
export function isClient(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Get current environment name
 */
export function getEnvironment(): 'development' | 'production' | 'test' {
  return (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development'
}

/**
 * Check if debug mode is enabled
 * Debug mode is enabled in development or when DEBUG env var is set
 */
export function isDebugMode(): boolean {
  return isDevelopment() || process.env.DEBUG === 'true'
}
