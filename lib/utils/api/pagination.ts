/**
 * Pagination Utilities for API Routes
 *
 * Provides consistent pagination logic across all list endpoints
 */

export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationMeta
}

/**
 * Extract and validate pagination parameters from URL search params
 *
 * @param searchParams - URLSearchParams from request
 * @param maxLimit - Maximum allowed limit (default: 100)
 * @returns Validated pagination parameters
 *
 * @example
 * const { page, limit, skip } = getPaginationParams(request.nextUrl.searchParams)
 * const items = await prisma.products.findMany({ skip, take: limit })
 */
export function getPaginationParams(
  searchParams: URLSearchParams,
  maxLimit: number = 100
): PaginationParams {
  // Parse page number (default: 1, min: 1)
  const pageParam = searchParams.get('page')
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)

  // Parse limit (default: 20, min: 1, max: maxLimit)
  const limitParam = searchParams.get('limit')
  const limit = Math.max(
    1,
    Math.min(maxLimit, parseInt(limitParam || '20', 10) || 20)
  )

  // Calculate skip value for database query
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

/**
 * Build a standardized paginated response object
 *
 * @param items - Array of items to return
 * @param total - Total count of items (from database count query)
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Paginated response with metadata
 *
 * @example
 * const [items, total] = await Promise.all([
 *   prisma.products.findMany({ skip, take: limit }),
 *   prisma.products.count()
 * ])
 * return NextResponse.json(buildPaginatedResponse(items, total, page, limit))
 */
export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit)

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }
}

/**
 * Build pagination metadata for cursor-based pagination
 *
 * @param items - Array of items
 * @param cursor - Function to extract cursor from item
 * @param limit - Items per page
 * @returns Cursor pagination metadata
 *
 * @example
 * const items = await prisma.products.findMany({
 *   take: limit + 1,
 *   cursor: cursor ? { id: cursor } : undefined
 * })
 * const hasMore = items.length > limit
 * const data = hasMore ? items.slice(0, -1) : items
 * const meta = buildCursorPaginationMeta(data, item => item.id, limit, hasMore)
 */
export function buildCursorPaginationMeta<T>(
  items: T[],
  getCursor: (item: T) => string,
  limit: number,
  hasMore: boolean
): {
  limit: number
  nextCursor: string | null
  hasMore: boolean
} {
  const nextCursor = hasMore && items.length > 0
    ? getCursor(items[items.length - 1])
    : null

  return {
    limit,
    nextCursor,
    hasMore,
  }
}
