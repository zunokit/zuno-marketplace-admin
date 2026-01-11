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
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production' ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
  ) {
    return true;
  }
  return false;
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
  return !isProduction() || process.env.DEBUG === 'true'
}

/**
 * Get application URL based on environment
 * Checks for environment variables, falls back to Vercel URL, then localhost
 */
export function getUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  }

  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
  ) {
    const vercelUrl =
      process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
    if (vercelUrl && vercelUrl.trim() !== "") {
      return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
    }
  }

  return "http://localhost:3000";
}
