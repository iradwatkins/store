import { randomBytes } from "crypto"

/**
 * Generate a secure, single-use token for review submission
 * Format: orderItemId + random salt, hashed
 */
export function generateReviewToken(orderItemId: string): string {
  const salt = randomBytes(16).toString("hex")
  const payload = `${orderItemId}:${salt}:${Date.now()}`
  const token = Buffer.from(payload).toString("base64url")
  return token
}

/**
 * Decode and validate review token
 * Returns orderItemId if valid, null if invalid/expired
 */
export function decodeReviewToken(token: string): {
  orderItemId: string | null
  isValid: boolean
  reason?: string
} {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8")
    const [orderItemId, salt, timestamp] = decoded.split(":")

    if (!orderItemId || !salt || !timestamp) {
      return { orderItemId: null, isValid: false, reason: "Invalid token format" }
    }

    // Check if token is expired (30 days)
    const tokenAge = Date.now() - parseInt(timestamp)
    const thirtyDays = 30 * 24 * 60 * 60 * 1000
    if (tokenAge > thirtyDays) {
      return { orderItemId, isValid: false, reason: "Token expired (30 days)" }
    }

    return { orderItemId, isValid: true }
  } catch {
    return { orderItemId: null, isValid: false, reason: "Invalid token" }
  }
}

/**
 * Generate review URL for email
 */
export function getReviewUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://stores.stepperslife.com"
  return `${base}/review/${token}`
}
