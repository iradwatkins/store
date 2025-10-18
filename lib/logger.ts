/**
 * Professional logging utility for production-ready applications
 * Replaces console.* statements with structured, configurable logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  stack?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatMessage(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      ...(level === 'error' && { stack: new Error().stack })
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isProduction) {
      // In production, only log warnings and errors
      return level === 'warn' || level === 'error'
    }
    // In development, log everything
    return true
  }

  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return

    if (this.isDevelopment) {
      // Development: Use console with colors
      const colors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
      }
      const reset = '\x1b[0m'
      
      console[entry.level === 'debug' ? 'log' : entry.level](
        `${colors[entry.level]}[${entry.level.toUpperCase()}]${reset} ${entry.message}`,
        entry.context ? entry.context : ''
      )
    } else {
      // Production: Structured JSON logging
      console.error(JSON.stringify(entry))
    }
  }

  debug(message: string, context?: LogContext): void {
    this.output(this.formatMessage('debug', message, context))
  }

  info(message: string, context?: LogContext): void {
    this.output(this.formatMessage('info', message, context))
  }

  warn(message: string, context?: LogContext): void {
    this.output(this.formatMessage('warn', message, context))
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
    }
    
    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    } else if (error && typeof error === 'object') {
      errorContext.errorDetails = error
    }

    this.output(this.formatMessage('error', message, errorContext))
  }

  // API-specific logging helpers
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`${method} ${path}`, context)
  }

  apiError(method: string, path: string, error: Error | unknown, context?: LogContext): void {
    this.error(`${method} ${path} failed`, error, context)
  }

  // Database operation logging
  dbQuery(operation: string, table: string, duration?: number): void {
    this.debug(`DB ${operation} on ${table}`, duration ? { duration: `${duration}ms` } : undefined)
  }

  dbError(operation: string, table: string, error: Error | unknown): void {
    this.error(`DB ${operation} on ${table} failed`, error)
  }

  // User action logging
  userAction(userId: string, action: string, context?: LogContext): void {
    this.info(`User action: ${action}`, { userId, ...context })
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 1000 ? 'warn' : 'info'
    this[level](`Performance: ${operation} took ${duration}ms`, context)
  }
}

// Export singleton instance
export const logger = new Logger()

// Export individual log functions for easier migration
export const { debug, info, warn, error } = logger

// Performance measurement utility
export function measurePerformance<T>(
  operation: string,
  fn: () => T | Promise<T>,
  context?: LogContext
): T | Promise<T> {
  const start = Date.now()
  
  const result = fn()
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const duration = Date.now() - start
      logger.performance(operation, duration, context)
    })
  } else {
    const duration = Date.now() - start
    logger.performance(operation, duration, context)
    return result
  }
}

// API middleware helper
export function withLogging<T extends (...args: unknown[]) => unknown>(
  operation: string,
  fn: T
): T {
  return ((...args: unknown[]) => {
    const start = Date.now()
    
    try {
      const result = fn(...args)
      
      if (result instanceof Promise) {
        return result
          .then((res) => {
            logger.performance(operation, Date.now() - start)
            return res
          })
          .catch((error) => {
            logger.error(`${operation} failed`, error)
            throw error
          })
      } else {
        logger.performance(operation, Date.now() - start)
        return result
      }
    } catch (error) {
      logger.error(`${operation} failed`, error)
      throw error
    }
  }) as T
}

export default logger