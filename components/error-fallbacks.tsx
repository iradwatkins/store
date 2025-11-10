"use client"

import React from 'react'
import { AlertTriangle, RefreshCw, ShoppingCart, Search, Package } from 'lucide-react'
import { ErrorFallbackProps } from './error-boundary'

/**
 * Specialized Error Fallback Components
 * 
 * These components provide contextual error displays for specific
 * parts of the application, offering appropriate recovery actions.
 */

/**
 * Navigation Error Fallback
 * 
 * Displays when the main navigation fails to load
 */
export function NavigationErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <div className="bg-destructive/10 border-b border-destructive/20 p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm font-medium">Navigation unavailable</span>
        </div>
        <button
          onClick={resetError}
          className="inline-flex items-center gap-1 text-sm text-destructive hover:text-destructive/80 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  )
}

/**
 * Cart Error Fallback
 * 
 * Displays when the shopping cart fails to load
 */
export function CartErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <div className="fixed right-4 bottom-4 bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <ShoppingCart className="w-5 h-5 text-destructive" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-foreground">Cart Error</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Unable to load shopping cart
          </p>
          <button
            onClick={resetError}
            className="mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Product Grid Error Fallback
 * 
 * Displays when product listings fail to load
 */
export function ProductGridErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <div className="border border-destructive/20 rounded-lg p-8 bg-destructive/5 text-center">
      <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
        <Package className="w-6 h-6 text-destructive" />
      </div>
      <h3 className="font-medium text-foreground mb-2">
        Unable to load products
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        There was a problem loading the product list. This might be due to a network issue.
      </p>
      <button
        onClick={resetError}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
      >
        <RefreshCw className="w-4 h-4" />
        Reload products
      </button>
    </div>
  )
}

/**
 * Search Error Fallback
 * 
 * Displays when search functionality fails
 */
export function SearchErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <div className="border border-destructive/20 rounded-lg p-6 bg-destructive/5">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Search className="w-5 h-5 text-destructive" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-foreground">Search unavailable</h4>
          <p className="text-sm text-muted-foreground mt-1">
            The search feature is temporarily unavailable
          </p>
        </div>
        <button
          onClick={resetError}
          className="px-3 py-1 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  )
}

/**
 * Dashboard Section Error Fallback
 * 
 * Displays when dashboard sections fail to load
 */
export function DashboardSectionErrorFallback({ resetError, context }: ErrorFallbackProps) {
  const sectionName = context?.replace('section-', '') || 'section'
  
  return (
    <div className="border border-destructive/20 rounded-lg p-6 bg-destructive/5">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
          </div>
          <div>
            <h4 className="font-medium text-foreground capitalize">
              {sectionName} unavailable
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              This section couldn&apos;t be loaded due to an error
            </p>
          </div>
        </div>
        <button
          onClick={resetError}
          className="flex items-center gap-1 px-3 py-1 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  )
}

/**
 * Form Error Fallback
 * 
 * Displays when forms encounter errors
 */
export function FormErrorFallback({ resetError, error }: ErrorFallbackProps) {
  return (
    <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-foreground">Form Error</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {error?.message || 'The form encountered an unexpected error'}
          </p>
          <button
            onClick={resetError}
            className="mt-3 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Reset form
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * API Error Fallback
 * 
 * Displays when API calls fail
 */
export function APIErrorFallback({ resetError, context }: ErrorFallbackProps) {
  const operation = context?.replace('async-', '') || 'operation'
  
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded-md text-sm border border-destructive/20">
      <AlertTriangle className="w-4 h-4" />
      <span>Failed to {operation}</span>
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
 * Image Error Fallback
 * 
 * Displays when images fail to load
 */
export function ImageErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center bg-muted rounded-lg p-4 min-h-32">
      <div className="text-center space-y-2">
        <Package className="w-8 h-8 text-muted-foreground mx-auto" />
        <p className="text-xs text-muted-foreground">Image unavailable</p>
        <button
          onClick={resetError}
          className="text-xs text-primary hover:text-primary/80 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  )
}