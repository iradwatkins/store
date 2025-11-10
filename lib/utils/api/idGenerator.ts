/**
 * ID Generation Utilities
 *
 * Consistent ID generation for database records
 */

/**
 * Generate a unique ID with a prefix
 *
 * Format: {prefix}_{timestamp}_{random}
 * Example: product_1699564800000_k3n2x9p4q
 *
 * @param prefix - Prefix to identify the resource type
 * @returns Unique ID string
 *
 * @example
 * const productId = generateId('product')
 * const orderId = generateId('order')
 * const addonId = generateId('addon')
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 11)
  return `${prefix}_${timestamp}_${random}`
}

/**
 * Common ID generators for frequently used types
 */
export const idGenerators = {
  product: () => generateId('product'),
  order: () => generateId('order'),
  addon: () => generateId('addon'),
  variant: () => generateId('variant'),
  image: () => generateId('image'),
  coupon: () => generateId('coupon'),
  review: () => generateId('review'),
  store: () => generateId('store'),
  zone: () => generateId('zone'),
  rate: () => generateId('rate'),
  vacation: () => generateId('vac'),
  withdraw: () => generateId('wdr'),
  announcement: () => generateId('ann'),
} as const

/**
 * Parse an ID to extract its components
 *
 * @param id - ID string to parse
 * @returns Object with prefix, timestamp, and random parts
 */
export function parseId(id: string): {
  prefix: string
  timestamp: number
  random: string
  createdAt: Date
} | null {
  const parts = id.split('_')

  if (parts.length !== 3) {
    return null
  }

  const [prefix, timestampStr, random] = parts
  const timestamp = parseInt(timestampStr, 10)

  if (isNaN(timestamp)) {
    return null
  }

  return {
    prefix,
    timestamp,
    random,
    createdAt: new Date(timestamp),
  }
}
