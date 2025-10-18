'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Global Error Component for Next.js App Router
 * 
 * This component handles errors that occur in the root layout,
 * providing a fallback UI when the entire application crashes.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the global error with enhanced context
    const eventId = `global_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    logger.error('Global application error', error, {
      eventId,
      digest: error.digest,
      level: 'global',
      userAgent: window.navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    })
  }, [error])

  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
          <div className="max-w-lg w-full text-center space-y-8">
            {/* Error Icon */}
            <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
            
            {/* Error Message */}
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Application Error
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                We're sorry, but something went wrong with the application.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Our team has been notified and is working to fix the issue.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                Try again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium"
              >
                <Home className="w-5 h-5" />
                Go to homepage
              </button>
            </div>

            {/* Development Information */}
            {isDevelopment && (
              <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-lg text-left">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium mb-3">
                  <Bug className="w-5 h-5" />
                  Development Information
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                  <div className="break-all">
                    <strong>Error:</strong> {error.message}
                  </div>
                  {error.digest && (
                    <div>
                      <strong>Digest:</strong> {error.digest}
                    </div>
                  )}
                  <div>
                    <strong>Timestamp:</strong> {new Date().toISOString()}
                  </div>
                  {error.stack && (
                    <details className="mt-3">
                      <summary className="cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 font-medium">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs bg-slate-200 dark:bg-slate-700 p-3 rounded overflow-auto max-h-40">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Support Information */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-500">
                If this problem persists, please contact support and reference the error ID: {error.digest || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}