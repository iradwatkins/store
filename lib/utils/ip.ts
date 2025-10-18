import { NextRequest } from "next/server"

/**
 * Get client IP address from Next.js request
 * Checks various headers in priority order
 */
export function getClientIp(request: NextRequest): string {
  // Check X-Forwarded-For (most common behind proxy/nginx)
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim()
  }

  // Check X-Real-IP (nginx)
  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp.trim()
  }

  // Check CF-Connecting-IP (Cloudflare)
  const cfIp = request.headers.get("cf-connecting-ip")
  if (cfIp) {
    return cfIp.trim()
  }

  // Fallback to "unknown"
  return "unknown"
}
