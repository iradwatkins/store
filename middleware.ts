import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * Add security headers to all responses
 * Note: Rate limiting is handled at API route level (not in middleware)
 * because Edge Runtime doesn't support ioredis
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // HSTS: Force HTTPS for 1 year
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // XSS Protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Content Security Policy (restrictive but allows necessary resources)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com", // Stripe requires unsafe-inline/eval
    "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
    "img-src 'self' data: blob: https: http:", // Allow external images, blob URLs for previews, MinIO and CDNs
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com",
    "frame-src https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
  response.headers.set('Content-Security-Policy', csp)

  // Permissions Policy (restrict browser features)
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  return response
}

/**
 * Check if domain is a custom domain (not a subdomain of stepperslife.com)
 */
function isCustomDomain(hostname: string): boolean {
  // Check if it's NOT a subdomain of stepperslife.com
  const isStepperslifeDomain = hostname.endsWith('.stepperslife.com') || hostname === 'stepperslife.com'
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')

  return !isStepperslifeDomain && !isLocalhost
}

/**
 * Lookup custom domain to find tenant slug
 * Edge runtime doesn't support Prisma, so we use a lightweight KV cache approach
 */
async function lookupCustomDomain(domain: string): Promise<string | null> {
  try {
    // In Edge runtime, we can't use Prisma directly
    // We'll use a simple fetch to our own API endpoint
    // For production, consider using Vercel KV or Upstash Redis for caching

    // For now, we'll skip the DB lookup in middleware and let the app handle it
    // This is a placeholder that could be enhanced with KV caching

    // Option 1: Use fetch to internal API (adds latency)
    // const response = await fetch(`${process.env.NEXTAUTH_URL}/api/internal/lookup-domain?domain=${domain}`)

    // Option 2: Return null and let app handle it (current approach)
    // The app can check x-custom-domain header and lookup in server components

    return null
  } catch (error) {
    logger.error('Error looking up custom domain', error)
    return null
  }
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  // Remove port from hostname for domain detection
  const domain = hostname.split(':')[0]

  // Check if this is a custom domain
  if (isCustomDomain(domain)) {
    logger.info('Custom domain detected', { domain })

    const response = NextResponse.next()

    // Inject custom domain into request headers for use in API routes/pages
    response.headers.set('x-custom-domain', domain)
    response.headers.set('x-is-custom-domain', 'true')

    // Note: Tenant slug lookup happens in the app layer since Edge runtime
    // doesn't support Prisma. Server components/API routes will use the
    // x-custom-domain header to query the database.

    // Add security headers
    return addSecurityHeaders(response)
  }

  // Extract subdomain for stepperslife.com subdomains
  // Examples:
  // - nike.stepperslife.com → subdomain = "nike"
  // - stores.stepperslife.com → subdomain = "stores" (main domain)
  // - localhost:3008 → subdomain = "localhost"
  const parts = domain.split('.')
  const subdomain = parts[0]

  // Skip tenant detection for main domain and localhost
  const isMainDomain = subdomain === 'stores' || subdomain === 'www' || domain.includes('localhost')

  // If subdomain detected and not main domain, check if tenant exists
  if (!isMainDomain && subdomain && domain.includes('stepperslife.com')) {
    logger.info('Subdomain detected', { subdomain })

    const response = NextResponse.next()

    // Inject subdomain into request headers for use in API routes/pages
    response.headers.set('x-tenant-slug', subdomain)
    response.headers.set('x-is-custom-domain', 'false')

    // Add security headers
    return addSecurityHeaders(response)
  }

  // Continue with request for main domain
  const response = NextResponse.next()
  response.headers.set('x-is-custom-domain', 'false')

  // Add security headers
  return addSecurityHeaders(response)
}

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)','/(api|trpc)(.*)'],
}
