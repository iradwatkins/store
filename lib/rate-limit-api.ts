import redis from './redis'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from "@/lib/logger"

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  message?: string // Custom error message
  keyPrefix?: string // Redis key prefix
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Unix timestamp when limit resets
}

/**
 * Sliding window rate limiter using Redis
 * Compatible with Node.js runtime (API routes)
 *
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const {
    windowMs,
    maxRequests,
    keyPrefix = 'ratelimit',
  } = config

  const key = `${keyPrefix}:${identifier}`
  const now = Date.now()
  const windowStart = now - windowMs

  try {
    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline()

    // Remove old entries outside the window
    pipeline.zremrangebyscore(key, 0, windowStart)

    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`)

    // Count requests in current window
    pipeline.zcard(key)

    // Set expiration
    pipeline.expire(key, Math.ceil(windowMs / 1000))

    const results = await pipeline.exec()

    // Extract count from results
    // results format: [[error, result], [error, result], ...]
    const count = (results?.[2]?.[1] as number) || 0

    const success = count <= maxRequests
    const remaining = Math.max(0, maxRequests - count)
    const reset = now + windowMs

    return {
      success,
      limit: maxRequests,
      remaining,
      reset,
    }
  } catch (error) {
    logger.error("Rate limit error:", error)
    // Fail open - allow request if Redis is down
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests,
      reset: now + windowMs,
    }
  }
}

/**
 * Express-style middleware for API routes
 * Usage: await applyRateLimit(request, { windowMs: 60000, maxRequests: 10 })
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  // Get identifier (IP address or user ID from session)
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown'

  const identifier = ip.split(',')[0].trim()

  const result = await rateLimit(identifier, config)

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

    return NextResponse.json(
      {
        error: config.message || 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': new Date(result.reset).toISOString(),
        },
      }
    )
  }

  // Request allowed - add rate limit headers for transparency
  // Note: These will be added by the calling route handler
  return null
}

/**
 * Add rate limit headers to successful response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString())
  return response
}

/**
 * Pre-configured rate limit configs for different endpoint types
 */
export const rateLimitConfigs = {
  // Authentication endpoints (login, register, password reset)
  auth: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many authentication attempts',
    keyPrefix: 'ratelimit:auth',
  },

  // Payment/checkout endpoints
  payment: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many payment requests',
    keyPrefix: 'ratelimit:payment',
  },

  // General API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Too many API requests',
    keyPrefix: 'ratelimit:api',
  },

  // Analytics endpoints (more expensive queries)
  analytics: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many analytics requests',
    keyPrefix: 'ratelimit:analytics',
  },

  // Strict rate limit for sensitive operations
  strict: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many requests for sensitive operation',
    keyPrefix: 'ratelimit:strict',
  },
}
