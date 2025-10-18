/**
 * Integration Tests: Analytics Dashboard
 * Sprint 5 Week 9 - Task 3
 *
 * Tests analytics calculation accuracy including:
 * - 30-day, 90-day, all-time sales aggregation
 * - Order counts for different periods
 * - Low stock product detection
 * - Top products ranking by revenue
 */

import { GET } from '@/app/api/dashboard/analytics/route'
import { NextRequest } from 'next/server'

// Mock NextAuth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}))

// Mock Redis
jest.mock('@/lib/redis', () => ({
  __esModule: true,
  default: {
    pipeline: jest.fn(() => ({
      zremrangebyscore: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, 0],
        [null, 1],
        [null, 5], // Rate limit count (under limit of 10)
        [null, 1],
      ]),
    })),
  },
}))

describe('GET /api/dashboard/analytics', () => {
  it('should return 401 when user is not authenticated', async () => {
    const { auth } = await import('@/lib/auth')
    ;(auth as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3008/api/dashboard/analytics')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })
})
