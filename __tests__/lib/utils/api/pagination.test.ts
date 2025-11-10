/**
 * Unit Tests: Pagination Utilities
 *
 * Tests for pagination helper functions
 */

import {
  getPaginationParams,
  buildPaginatedResponse,
  buildCursorPaginationMeta,
} from '@/lib/utils/api/pagination'

describe('getPaginationParams', () => {
  it('should return default values when no params are provided', () => {
    const searchParams = new URLSearchParams()
    const result = getPaginationParams(searchParams)

    expect(result).toEqual({
      page: 1,
      limit: 20,
      skip: 0,
    })
  })

  it('should parse page and limit from search params', () => {
    const searchParams = new URLSearchParams('page=3&limit=50')
    const result = getPaginationParams(searchParams)

    expect(result).toEqual({
      page: 3,
      limit: 50,
      skip: 100, // (3 - 1) * 50
    })
  })

  it('should enforce maxLimit', () => {
    const searchParams = new URLSearchParams('limit=500')
    const result = getPaginationParams(searchParams, 100)

    expect(result.limit).toBe(100)
  })

  it('should handle invalid page numbers', () => {
    const searchParams = new URLSearchParams('page=invalid')
    const result = getPaginationParams(searchParams)

    expect(result.page).toBe(1)
    expect(result.skip).toBe(0)
  })

  it('should handle negative page numbers', () => {
    const searchParams = new URLSearchParams('page=-5')
    const result = getPaginationParams(searchParams)

    expect(result.page).toBe(1)
    expect(result.skip).toBe(0)
  })

  it('should handle zero page number', () => {
    const searchParams = new URLSearchParams('page=0')
    const result = getPaginationParams(searchParams)

    expect(result.page).toBe(1)
    expect(result.skip).toBe(0)
  })

  it('should handle invalid limit', () => {
    const searchParams = new URLSearchParams('limit=invalid')
    const result = getPaginationParams(searchParams)

    expect(result.limit).toBe(20)
  })

  it('should handle negative limit', () => {
    const searchParams = new URLSearchParams('limit=-10')
    const result = getPaginationParams(searchParams)

    expect(result.limit).toBe(1) // Enforces minimum of 1
  })

  it('should calculate skip correctly for different pages', () => {
    const testCases = [
      { page: 1, limit: 20, expectedSkip: 0 },
      { page: 2, limit: 20, expectedSkip: 20 },
      { page: 5, limit: 10, expectedSkip: 40 },
      { page: 10, limit: 50, expectedSkip: 450 },
    ]

    testCases.forEach(({ page, limit, expectedSkip }) => {
      const searchParams = new URLSearchParams(`page=${page}&limit=${limit}`)
      const result = getPaginationParams(searchParams)

      expect(result.skip).toBe(expectedSkip)
    })
  })
})

describe('buildPaginatedResponse', () => {
  it('should build correct response for first page', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
    const total = 100
    const page = 1
    const limit = 20

    const result = buildPaginatedResponse(items, total, page, limit)

    expect(result).toEqual({
      items,
      pagination: {
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: false,
      },
    })
  })

  it('should build correct response for middle page', () => {
    const items = [{ id: 1 }, { id: 2 }]
    const total = 100
    const page = 3
    const limit = 20

    const result = buildPaginatedResponse(items, total, page, limit)

    expect(result).toEqual({
      items,
      pagination: {
        page: 3,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: true,
      },
    })
  })

  it('should build correct response for last page', () => {
    const items = [{ id: 1 }]
    const total = 100
    const page = 5
    const limit = 20

    const result = buildPaginatedResponse(items, total, page, limit)

    expect(result).toEqual({
      items,
      pagination: {
        page: 5,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNextPage: false,
        hasPreviousPage: true,
      },
    })
  })

  it('should handle empty results', () => {
    const items: any[] = []
    const total = 0
    const page = 1
    const limit = 20

    const result = buildPaginatedResponse(items, total, page, limit)

    expect(result).toEqual({
      items: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })
  })

  it('should calculate totalPages correctly with remainders', () => {
    const items = [{ id: 1 }]

    // 25 items with limit 10 = 3 pages
    const result1 = buildPaginatedResponse(items, 25, 1, 10)
    expect(result1.pagination.totalPages).toBe(3)

    // 20 items with limit 10 = 2 pages
    const result2 = buildPaginatedResponse(items, 20, 1, 10)
    expect(result2.pagination.totalPages).toBe(2)

    // 21 items with limit 10 = 3 pages
    const result3 = buildPaginatedResponse(items, 21, 1, 10)
    expect(result3.pagination.totalPages).toBe(3)
  })

  it('should handle single page results', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
    const total = 3
    const page = 1
    const limit = 20

    const result = buildPaginatedResponse(items, total, page, limit)

    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 3,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    })
  })
})

describe('buildCursorPaginationMeta', () => {
  it('should build cursor metadata without more items', () => {
    const items = [
      { id: '1', createdAt: new Date('2025-01-01') },
      { id: '2', createdAt: new Date('2025-01-02') },
      { id: '3', createdAt: new Date('2025-01-03') },
    ]

    const result = buildCursorPaginationMeta(
      items,
      (item) => item.id,
      10,
      false
    )

    expect(result).toEqual({
      limit: 10,
      hasMore: false,
      nextCursor: null,
    })
  })

  it('should indicate hasMore and provide nextCursor when more items exist', () => {
    const items = [
      { id: '1', createdAt: new Date('2025-01-01') },
      { id: '2', createdAt: new Date('2025-01-02') },
      { id: '3', createdAt: new Date('2025-01-03') },
    ]

    const result = buildCursorPaginationMeta(
      items,
      (item) => item.id,
      3,
      true
    )

    expect(result).toEqual({
      limit: 3,
      hasMore: true,
      nextCursor: '3', // Last item's ID
    })
  })

  it('should handle empty items', () => {
    const items: any[] = []

    const result = buildCursorPaginationMeta(
      items,
      (item) => item.id,
      10,
      false
    )

    expect(result).toEqual({
      limit: 10,
      hasMore: false,
      nextCursor: null,
    })
  })

  it('should handle single item without more', () => {
    const items = [{ id: '1' }]

    const result = buildCursorPaginationMeta(
      items,
      (item) => item.id,
      10,
      false
    )

    expect(result).toEqual({
      limit: 10,
      hasMore: false,
      nextCursor: null,
    })
  })

  it('should handle single item with more', () => {
    const items = [{ id: '1' }]

    const result = buildCursorPaginationMeta(
      items,
      (item) => item.id,
      10,
      true
    )

    expect(result).toEqual({
      limit: 10,
      hasMore: true,
      nextCursor: '1',
    })
  })

  it('should work with different cursor fields', () => {
    const items = [
      { userId: 'user1', name: 'Alice' },
      { userId: 'user2', name: 'Bob' },
    ]

    const result = buildCursorPaginationMeta(
      items,
      (item) => item.userId,
      2,
      false
    )

    expect(result).toEqual({
      limit: 2,
      hasMore: false,
      nextCursor: null,
    })
  })

  it('should use custom cursor function', () => {
    const items = [
      { id: '1', slug: 'product-1' },
      { id: '2', slug: 'product-2' },
      { id: '3', slug: 'product-3' },
    ]

    const result = buildCursorPaginationMeta(
      items,
      (item) => item.slug,
      3,
      true
    )

    expect(result).toEqual({
      limit: 3,
      hasMore: true,
      nextCursor: 'product-3',
    })
  })
})
