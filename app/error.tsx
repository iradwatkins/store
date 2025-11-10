'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug } from 'lucide-react'
import { logger } from '@/lib/logger'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Page Error Component for Next.js App Router
 * 
 * This component handles errors that occur within individual pages,
 * providing recovery options while maintaining the app layout.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the page error with context
    const eventId = `page_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    logger.error('Page error occurred', error, {
      eventId,
      digest: error.digest,
      level: 'page',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      referrer: typeof document !== 'undefined' ? document.referrer : 'SSR'
    })
  }, [error])

  const isDevelopment = process.env.NODE_ENV === 'development'

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Error Icon */}
        <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>
        
        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Oops! Something went wrong
          </h1>
          <p className="text-xl text-muted-foreground">
            We encountered an unexpected error while loading this page.
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Don&apos;t worry, this has been automatically reported to our team.
            You can try refreshing the page or go back to continue browsing.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            Try again
          </button>
          
          <button
            onClick={goBack}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Go back
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            Home
          </button>
        </div>

        {/* Development Information */}
        {isDevelopment && (
          <div className="p-6 bg-muted rounded-lg text-left max-w-full">
            <div className="flex items-center gap-2 text-foreground font-medium mb-4">
              <Bug className="w-5 h-5" />
              Development Information
            </div>
            <div className="text-sm text-muted-foreground space-y-3">
              <div className="break-all">
                <strong className="text-foreground">Error Message:</strong><br />
                {error.message}
              </div>
              {error.digest && (
                <div>
                  <strong className="text-foreground">Error Digest:</strong><br />
                  {error.digest}
                </div>
              )}
              <div>
                <strong className="text-foreground">Timestamp:</strong><br />
                {new Date().toISOString()}
              </div>
              {error.stack && (
                <details className="mt-4">
                  <summary className="cursor-pointer hover:text-foreground font-medium text-foreground">
                    Stack Trace
                  </summary>
                  <pre className="mt-3 text-xs bg-background border border-border p-4 rounded overflow-auto max-h-60 font-mono">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Error ID: {error.digest || `${Date.now()}`} • 
            If this problem persists, please contact our support team
          </p>
        </div>
      </div>
    </div>
  )
}