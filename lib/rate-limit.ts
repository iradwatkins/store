import redis from "@/lib/redis"

/**
 * Simple Redis-based rate limiter
 *
 * @param identifier - Unique identifier for the request (e.g., userId, IP)
 * @param limit - Maximum number of requests allowed
 * @param windowSeconds - Time window in seconds
 * @returns Object with { success: boolean, remaining: number, reset: number }
 */
export async function rateLimit(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const key = `rate-limit:${identifier}`

  try {
    // Get current count
    const current = await redis.get(key)
    const count = current ? parseInt(current) : 0

    if (count >= limit) {
      // Get TTL for reset time
      const ttl = await redis.ttl(key)
      return {
        success: false,
        remaining: 0,
        reset: Date.now() + (ttl * 1000),
      }
    }

    // Increment counter
    const newCount = await redis.incr(key)

    // Set expiry on first request
    if (newCount === 1) {
      await redis.expire(key, windowSeconds)
    }

    return {
      success: true,
      remaining: limit - newCount,
      reset: Date.now() + (windowSeconds * 1000),
    }
  } catch (error) {
    console.error("Rate limit error:", error)
    // On Redis error, allow the request (fail open)
    return {
      success: true,
      remaining: limit,
      reset: Date.now() + (windowSeconds * 1000),
    }
  }
}

/**
 * Middleware-style rate limiting for API routes
 * Usage: const rateLimitResult = await checkRateLimit(userId)
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; response?: Response }> {
  const result = await rateLimit(identifier, limit, windowSeconds)

  if (!result.success) {
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: "Too many requests",
          message: `Rate limit exceeded. Try again in ${Math.ceil((result.reset - Date.now()) / 1000)} seconds.`,
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": result.reset.toString(),
            "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
          },
        }
      ),
    }
  }

  return { allowed: true }
}
