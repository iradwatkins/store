import { Search, Home, ArrowLeft, MapPin } from 'lucide-react'
import Link from 'next/link'

/**
 * 404 Not Found Page for Next.js App Router
 * 
 * This component handles cases where users navigate to non-existent routes,
 * providing helpful navigation options and maintaining good UX.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Illustration */}
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
          <MapPin className="w-12 h-12 text-muted-foreground" />
        </div>
        
        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Page not found
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Sorry, we couldn't find the page you're looking for. 
            It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            Go to homepage
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Go back
          </button>
        </div>

        {/* Search Suggestion */}
        <div className="pt-6 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Search className="w-4 h-4" />
            <span>Try searching for what you need from the homepage</span>
          </div>
        </div>

        {/* Popular Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">
            Popular pages
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
            <Link
              href="/store"
              className="p-3 text-sm border border-input rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Browse Products
            </Link>
            <Link
              href="/how-it-works"
              className="p-3 text-sm border border-input rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/for-sellers"
              className="p-3 text-sm border border-input rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              For Sellers
            </Link>
            <Link
              href="/tenant-demo"
              className="p-3 text-sm border border-input rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}