/* eslint-disable no-console */
import { logger } from './logger'

/**
 * Error Reporting Utilities
 * 
 * Provides standardized error reporting with enhanced context
 * and integration with monitoring services.
 */

export interface ErrorContext {
  userId?: string
  sessionId?: string
  feature?: string
  action?: string
  metadata?: Record<string, any>
  tags?: string[]
  level?: 'error' | 'warning' | 'info'
  fingerprint?: string[]
}

export interface ErrorReport {
  id: string
  timestamp: string
  error: Error
  context: ErrorContext
  environment: {
    userAgent?: string
    url?: string
    referrer?: string
    viewport?: { width: number; height: number }
    connection?: string
  }
  stack?: string
}

class ErrorReporter {
  private reports: ErrorReport[] = []
  private readonly maxReports = 100

  /**
   * Report an error with enhanced context
   */
  report(error: Error, context: ErrorContext = {}): string {
    const id = this.generateErrorId()
    const timestamp = new Date().toISOString()
    
    // Gather environment information
    const environment = this.gatherEnvironmentInfo()
    
    // Create error report
    const report: ErrorReport = {
      id,
      timestamp,
      error,
      context: {
        level: 'error',
        ...context
      },
      environment,
      stack: error.stack
    }

    // Store report (with rotation)
    this.storeReport(report)

    // Log to structured logger
    this.logError(report)

    // Send to external monitoring (if configured)
    this.sendToMonitoring(report)

    return id
  }

  /**
   * Report a warning with context
   */
  warning(message: string, context: ErrorContext = {}): string {
    return this.report(new Error(message), { ...context, level: 'warning' })
  }

  /**
   * Report performance issues
   */
  performance(operation: string, duration: number, context: ErrorContext = {}): string {
    return this.report(
      new Error(`Performance issue: ${operation} took ${duration}ms`),
      {
        ...context,
        level: 'warning',
        feature: 'performance',
        metadata: { duration, operation, ...context.metadata }
      }
    )
  }

  /**
   * Report API errors with request context
   */
  apiError(
    error: Error, 
    request: { method: string; url: string; status?: number },
    context: ErrorContext = {}
  ): string {
    return this.report(error, {
      ...context,
      feature: 'api',
      metadata: {
        request,
        ...context.metadata
      }
    })
  }

  /**
   * Report user interaction errors
   */
  userInteractionError(
    error: Error,
    interaction: { type: string; target: string; data?: any },
    context: ErrorContext = {}
  ): string {
    return this.report(error, {
      ...context,
      feature: 'user-interaction',
      metadata: {
        interaction,
        ...context.metadata
      }
    })
  }

  /**
   * Get recent error reports
   */
  getReports(limit = 10): ErrorReport[] {
    return this.reports.slice(-limit)
  }

  /**
   * Get error report by ID
   */
  getReport(id: string): ErrorReport | null {
    return this.reports.find(report => report.id === id) || null
  }

  /**
   * Clear all stored reports
   */
  clearReports(): void {
    this.reports = []
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private gatherEnvironmentInfo() {
    if (typeof window === 'undefined') {
      return { userAgent: 'SSR' }
    }

    return {
      userAgent: window.navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    }
  }

  private storeReport(report: ErrorReport): void {
    this.reports.push(report)
    
    // Keep only the most recent reports
    if (this.reports.length > this.maxReports) {
      this.reports = this.reports.slice(-this.maxReports)
    }
  }

  private logError(report: ErrorReport): void {
    const logContext = {
      errorId: report.id,
      timestamp: report.timestamp,
      context: report.context,
      environment: report.environment
    }
    
    if (report.context.level === 'warning') {
      logger.warn('Warning reported', { 
        error: report.error.message,
        ...logContext 
      })
    } else {
      logger.error('Error reported', report.error, logContext)
    }
  }

  private sendToMonitoring(report: ErrorReport): void {
    // Integration point for external monitoring services
    // This could send to Sentry, DataDog, LogRocket, etc.
    
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Report: ${report.id}`)
      console.error('Error:', report.error)
      console.log('Context:', report.context)
      console.log('Environment:', report.environment)
      console.groupEnd()
    }

    // Example: Send to Sentry (if configured)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.withScope((scope: any) => {
        // Add context to Sentry scope
        scope.setTag('errorId', report.id)
        scope.setLevel(report.context.level || 'error')
        
        if (report.context.userId) {
          scope.setUser({ id: report.context.userId })
        }
        
        if (report.context.feature) {
          scope.setTag('feature', report.context.feature)
        }
        
        if (report.context.tags) {
          report.context.tags.forEach(tag => scope.setTag('custom', tag))
        }
        
        if (report.context.metadata) {
          scope.setContext('metadata', report.context.metadata)
        }
        
        scope.setContext('environment', report.environment)
        
        // Send to Sentry
        ;(window as any).Sentry.captureException(report.error)
      })
    }
  }
}

// Global error reporter instance
export const errorReporter = new ErrorReporter()

/**
 * Quick error reporting functions
 */
export const reportError = (error: Error, context?: ErrorContext) => 
  errorReporter.report(error, context)

export const reportWarning = (message: string, context?: ErrorContext) => 
  errorReporter.warning(message, context)

export const reportPerformance = (operation: string, duration: number, context?: ErrorContext) => 
  errorReporter.performance(operation, duration, context)

export const reportAPIError = (
  error: Error, 
  request: { method: string; url: string; status?: number }, 
  context?: ErrorContext
) => errorReporter.apiError(error, request, context)

export const reportUserError = (
  error: Error,
  interaction: { type: string; target: string; data?: any },
  context?: ErrorContext
) => errorReporter.userInteractionError(error, interaction, context)

/**
 * React Hook for error reporting
 */
export function useErrorReporting() {
  return {
    reportError,
    reportWarning,
    reportPerformance,
    reportAPIError,
    reportUserError,
    getReports: () => errorReporter.getReports(),
    getReport: (id: string) => errorReporter.getReport(id)
  }
}

/**
 * Error boundary integration
 */
export function handleBoundaryError(
  error: Error, 
  errorInfo: { componentStack: string },
  boundaryContext: string
): string {
  return errorReporter.report(error, {
    feature: 'error-boundary',
    action: 'component-error',
    metadata: {
      componentStack: errorInfo.componentStack,
      boundaryContext
    },
    tags: ['react-error-boundary']
  })
}

/**
 * Promise rejection handler
 */
export function handleUnhandledRejection(reason: any): string {
  const error = reason instanceof Error ? reason : new Error(String(reason))
  
  return errorReporter.report(error, {
    feature: 'unhandled-promise',
    action: 'rejection',
    tags: ['unhandled-rejection']
  })
}

/**
 * Global error handler
 */
export function handleGlobalError(event: ErrorEvent): string {
  const error = event.error || new Error(event.message)
  
  return errorReporter.report(error, {
    feature: 'global-error',
    action: 'uncaught-exception',
    metadata: {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    },
    tags: ['uncaught-error']
  })
}