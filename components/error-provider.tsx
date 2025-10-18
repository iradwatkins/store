"use client"

import React from 'react'
import { 
  handleBoundaryError, 
  handleUnhandledRejection, 
  handleGlobalError,
  reportError
} from '@/lib/error-reporting'
import { ErrorBoundary } from './error-boundary'

interface ErrorProviderProps {
  children: React.ReactNode
}

/**
 * Application-wide Error Provider
 * 
 * This provider wraps the entire application with error boundaries
 * and provides global error handling context.
 */
export function ErrorProvider({ children }: ErrorProviderProps) {
  const handleAppError = React.useCallback((error: Error, errorInfo: any) => {
    // Use enhanced error reporting system
    handleBoundaryError(error, errorInfo, 'root-application')
  }, [])

  // Set up global error handlers
  React.useEffect(() => {
    // Handle uncaught JavaScript errors
    const handleError = (event: ErrorEvent) => {
      handleGlobalError(event)
    }

    // Handle unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      handleUnhandledRejection(event.reason)
    }

    // Add event listeners
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  return (
    <ErrorBoundary 
      level="page" 
      context="root-application"
      onError={handleAppError}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Page Error Boundary
 * 
 * Wrap individual pages with this boundary for page-level error handling
 */
export function PageErrorBoundary({ 
  children, 
  pageName 
}: { 
  children: React.ReactNode
  pageName?: string 
}) {
  return (
    <ErrorBoundary 
      level="page" 
      context={`page-${pageName || 'unknown'}`}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Section Error Boundary
 * 
 * Wrap major sections of pages with this boundary
 */
export function SectionErrorBoundary({ 
  children, 
  sectionName 
}: { 
  children: React.ReactNode
  sectionName: string 
}) {
  return (
    <ErrorBoundary 
      level="section" 
      context={`section-${sectionName}`}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Component Error Boundary
 * 
 * Wrap individual components that might fail
 */
export function ComponentErrorBoundary({ 
  children, 
  componentName 
}: { 
  children: React.ReactNode
  componentName: string 
}) {
  return (
    <ErrorBoundary 
      level="component" 
      context={`component-${componentName}`}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Async Component Error Boundary
 * 
 * Special boundary for async operations and data fetching
 */
export function AsyncErrorBoundary({ 
  children, 
  operation 
}: { 
  children: React.ReactNode
  operation: string 
}) {
  return (
    <ErrorBoundary 
      level="section" 
      context={`async-${operation}`}
      onError={(error, errorInfo) => {
        reportError(error, {
          feature: 'async-operation',
          action: operation,
          metadata: { errorInfo }
        })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}