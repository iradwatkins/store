"use client"

import React from 'react'
import { logger } from '@/lib/logger'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

export interface ErrorInfo {
  componentStack: string;
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  eventId: string | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'page' | 'section' | 'component'
  context?: string
}

export interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  resetError: () => void
  eventId: string | null
  level: string
  context?: string
}

/**
 * Professional Error Boundary Component
 * 
 * Provides graceful error handling with logging, user-friendly UI,
 * and recovery options for different application contexts.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, level = 'component', context } = this.props
    
    // Generate unique event ID for this error
    const eventId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Enhanced error info
    const enhancedErrorInfo: ErrorInfo = {
      componentStack: errorInfo.componentStack || 'No component stack available'
    }
    
    // Update state with error details
    this.setState({
      errorInfo: enhancedErrorInfo,
      eventId: eventId
    })
    
    // Log error with context
    logger.error('React Error Boundary caught an error', error, {
      eventId,
      level,
      context,
      componentStack: errorInfo.componentStack,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'SSR'
    })
    
    // Call custom error handler if provided
    if (onError) {
      try {
        onError(error, enhancedErrorInfo)
      } catch (handlerError) {
        logger.error('Error in custom error handler', handlerError)
      }
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    })
  }

  render() {
    const { hasError, error, errorInfo, eventId } = this.state
    const { children, fallback: Fallback, level = 'component', context } = this.props

    if (hasError) {
      // Use custom fallback component if provided
      if (Fallback) {
        return (
          <Fallback
            error={error}
            errorInfo={errorInfo}
            resetError={this.resetError}
            eventId={eventId}
            level={level}
            context={context}
          />
        )
      }

      // Default fallback based on level
      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetError={this.resetError}
          eventId={eventId}
          level={level}
          context={context}
        />
      )
    }

    return children
  }
}

/**
 * Default Error Fallback Component
 * 
 * Provides different UI based on error boundary level
 */
function DefaultErrorFallback({ 
  error, 
  resetError, 
  eventId, 
  level, 
  context 
}: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Page-level error (most serious)
  if (level === 'page') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Something went wrong
            </h1>
            <p className="text-muted-foreground">
              We encountered an unexpected error while loading this page.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={resetError}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
            >
              <Home className="w-4 h-4" />
              Go home
            </button>
          </div>

          {isDevelopment && eventId && (
            <div className="p-4 bg-muted rounded-lg text-left">
              <div className="text-sm font-medium text-foreground mb-2">
                Development Info:
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Event ID: {eventId}</div>
                {context && <div>Context: {context}</div>}
                {error?.message && <div>Error: {error.message}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Section-level error (moderate)
  if (level === 'section') {
    return (
      <div className="border border-destructive/20 rounded-lg p-6 m-4 bg-destructive/5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-medium text-foreground">
                Section temporarily unavailable
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                This section encountered an error and couldn't be displayed.
              </p>
            </div>
            
            <button
              onClick={resetError}
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry section
            </button>

            {isDevelopment && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground">
                  Development details
                </summary>
                <div className="mt-2 p-2 bg-muted rounded text-xs">
                  <div>Event ID: {eventId}</div>
                  {context && <div>Context: {context}</div>}
                  {error?.message && <div>Error: {error.message}</div>}
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Component-level error (least serious)
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded-md text-sm">
      <Bug className="w-4 h-4" />
      <span>Component error</span>
      <button
        onClick={resetError}
        className="ml-2 text-xs underline hover:no-underline"
      >
        retry
      </button>
    </div>
  )
}

/**
 * Higher-order component for wrapping components with error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Hook for handling errors in functional components
 */
export function useErrorHandler() {
  return React.useCallback((error: Error, context?: string) => {
    const eventId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    logger.error('Manual error report', error, {
      eventId,
      context,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'SSR'
    })

    // In development, also throw to trigger error boundaries
    if (process.env.NODE_ENV === 'development') {
      throw error
    }
  }, [])
}