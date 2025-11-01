/**
 * Logger Utility
 * Centralized logging system with different log levels
 * Never use console.log directly - always use this logger
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isServer = typeof window === 'undefined'

  /**
   * Safe JSON.stringify that handles circular references
   */
  private safeStringify(obj: unknown): string {
    const seen = new WeakSet()
    return JSON.stringify(
      obj,
      (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]'
          }
          seen.add(value)
        }
        return value
      },
      2
    )
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const env = this.isServer ? '[Server]' : '[Client]'
    const contextStr = context ? `\n${this.safeStringify(context)}` : ''
    return `${timestamp} ${env} [${level.toUpperCase()}] ${message}${contextStr}`
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    // eslint-disable-next-line no-console
    console.info(this.formatMessage('info', message, context))
  }

  warn(message: string, context?: LogContext): void {
    // eslint-disable-next-line no-console
    console.warn(this.formatMessage('warn', message, context))
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    }
    // eslint-disable-next-line no-console
    console.error(this.formatMessage('error', message, errorContext))
  }
}

// Singleton instance
export const logger = new Logger()
