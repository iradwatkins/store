import redis from "./redis"

/**
 * Redis caching utilities for application-wide caching
 */

export interface CacheOptions {
  ttl?: number // Time to live in seconds (default: 300 = 5 minutes)
  tags?: string[] // Cache tags for invalidation
}

/**
 * Get a value from cache
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key)
    if (!cached) {
      return null
    }
    return JSON.parse(cached) as T
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error)
    return null
  }
}

/**
 * Set a value in cache
 */
export async function setCache<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  const { ttl = 300, tags = [] } = options

  try {
    const serialized = JSON.stringify(value)
    await redis.setex(key, ttl, serialized)

    // Store cache tags for invalidation
    if (tags.length > 0) {
      for (const tag of tags) {
        await redis.sadd(`cache-tag:${tag}`, key)
        await redis.expire(`cache-tag:${tag}`, ttl)
      }
    }
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error)
  }
}

/**
 * Delete a specific cache key
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error)
  }
}

/**
 * Invalidate all cache entries with a specific tag
 */
export async function invalidateCacheByTag(tag: string): Promise<void> {
  try {
    const keys = await redis.smembers(`cache-tag:${tag}`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
    await redis.del(`cache-tag:${tag}`)
  } catch (error) {
    console.error(`Cache invalidation error for tag ${tag}:`, error)
  }
}

/**
 * Invalidate multiple cache tags at once
 */
export async function invalidateCacheTags(tags: string[]): Promise<void> {
  for (const tag of tags) {
    await invalidateCacheByTag(tag)
  }
}

/**
 * Get or set cache (cache-aside pattern)
 * If value exists in cache, return it. Otherwise, compute it and cache it.
 */
export async function getOrSetCache<T>(
  key: string,
  compute: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache first
  const cached = await getCached<T>(key)
  if (cached !== null) {
    return cached
  }

  // Compute the value
  const value = await compute()

  // Store in cache
  await setCache(key, value, options)

  return value
}

/**
 * Cache key builders for common entities
 */
export const cacheKeys = {
  // Product catalog
  productCatalog: (filters?: {
    category?: string
    vendor?: string
    search?: string
    page?: number
  }) => {
    const parts = ["products", "catalog"]
    if (filters?.category) parts.push(`category:${filters.category}`)
    if (filters?.vendor) parts.push(`vendor:${filters.vendor}`)
    if (filters?.search) parts.push(`search:${filters.search}`)
    if (filters?.page) parts.push(`page:${filters.page}`)
    return parts.join(":")
  },

  // Single product
  product: (idOrSlug: string) => `product:${idOrSlug}`,

  // Vendor storefront
  vendorStorefront: (slug: string) => `vendor:storefront:${slug}`,

  // Vendor products
  vendorProducts: (vendorId: string, page?: number) =>
    `vendor:${vendorId}:products${page ? `:page:${page}` : ""}`,

  // Analytics (already using this pattern in Week 7)
  analytics: (vendorStoreId: string) => `analytics:${vendorStoreId}`,

  // Daily sales
  dailySales: (vendorStoreId: string) => `daily-sales:${vendorStoreId}`,

  // Categories
  categories: () => "categories:list",

  // Featured products
  featuredProducts: () => "products:featured",
}

/**
 * Cache tags for invalidation
 */
export const cacheTags = {
  products: "products",
  vendors: "vendors",
  categories: "categories",
  analytics: "analytics",

  // Specific entity tags
  product: (id: string) => `product:${id}`,
  vendor: (id: string) => `vendor:${id}`,
}

/**
 * Invalidate product-related caches when a product is updated
 */
export async function invalidateProductCache(productId: string, vendorStoreId: string) {
  await invalidateCacheTags([
    cacheTags.products,
    cacheTags.product(productId),
    cacheTags.vendor(vendorStoreId),
  ])
}

/**
 * Invalidate vendor-related caches when a vendor is updated
 */
export async function invalidateVendorCache(vendorStoreId: string) {
  await invalidateCacheTags([
    cacheTags.vendors,
    cacheTags.vendor(vendorStoreId),
  ])
}

/**
 * TTL constants for different cache types
 */
export const cacheTTL = {
  short: 60, // 1 minute - for frequently changing data
  medium: 300, // 5 minutes - default for most data
  long: 900, // 15 minutes - for relatively stable data
  veryLong: 3600, // 1 hour - for rarely changing data
}
