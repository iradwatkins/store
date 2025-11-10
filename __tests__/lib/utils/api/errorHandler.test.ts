/**
 * Unit Tests: Error Handler
 *
 * Tests for API error handling utilities
 */

/**
 * @jest-environment node
 */

// Mock Next.js server before any imports
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data: any, init?: ResponseInit) => {
      const response = {
        status: init?.status || 200,
        headers: new Map(Object.entries(init?.headers || {})),
        json: async () => data,
      }
      return response
    }),
  },
}))

import { z } from 'zod'
import {
  handleApiError,
  successResponse,
  errorResponse,
} from '@/lib/utils/api/errorHandler'
import {
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  BusinessLogicError,
  RateLimitError,
  ConflictError,
} from '@/lib/errors'

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}))

describe('handleApiError', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Custom Error Classes', () => {
    it('should handle AuthError with 401 status', async () => {
      const error = new AuthError('User not authenticated')
      const response = handleApiError(error, 'Test operation')

      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.error).toBe('User not authenticated')
    })

    it('should handle ForbiddenError with 403 status', async () => {
      const error = new ForbiddenError('Access denied')
      const response = handleApiError(error, 'Test operation')

      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.error).toBe('Access denied')
    })

    it('should handle NotFoundError with 404 status', async () => {
      const error = new NotFoundError('Resource not found')
      const response = handleApiError(error, 'Test operation')

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.error).toBe('Resource not found')
    })

    it('should handle ValidationError with 400 status and details', async () => {
      const error = new ValidationError('Validation failed', {
        field: 'email',
        issue: 'Invalid format',
      })
      const response = handleApiError(error, 'Test operation')

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Validation failed')
      expect(data.details).toEqual({
        field: 'email',
        issue: 'Invalid format',
      })
    })

    it('should handle BusinessLogicError with 400 status', async () => {
      const error = new BusinessLogicError('Invalid discount percentage')
      const response = handleApiError(error, 'Test operation')

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Invalid discount percentage')
    })

    it('should handle RateLimitError with 429 status and Retry-After header', async () => {
      const error = new RateLimitError('Too many requests')
      const response = handleApiError(error, 'Test operation')

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('60')

      const data = await response.json()
      expect(data.error).toBe('Too many requests')
    })

    it('should handle ConflictError with 409 status', async () => {
      const error = new ConflictError('Resource already exists')
      const response = handleApiError(error, 'Test operation')

      expect(response.status).toBe(409)

      const data = await response.json()
      expect(data.error).toBe('Resource already exists')
    })
  })

  describe('Zod Validation Errors', () => {
    it('should handle Zod errors with formatted issues', async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      })

      try {
        schema.parse({ email: 'invalid-email', age: 15 })
      } catch (error) {
        const response = handleApiError(error, 'Validate input')

        expect(response.status).toBe(400)

        const data = await response.json()
        expect(data.error).toBe('Invalid request data')
        expect(data.details).toHaveLength(2)
        expect(data.details[0]).toHaveProperty('path')
        expect(data.details[0]).toHaveProperty('message')
      }
    })

    it('should format Zod error paths correctly', async () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(1),
          }),
        }),
      })

      try {
        schema.parse({ user: { profile: { name: '' } } })
      } catch (error) {
        const response = handleApiError(error, 'Validate nested')

        const data = await response.json()
        expect(data.details[0].path).toBe('user.profile.name')
      }
    })
  })

  describe('Prisma Errors', () => {
    it('should handle P2002 unique constraint violation', async () => {
      const error = {
        code: 'P2002',
        meta: {
          target: ['email'],
        },
      }

      const response = handleApiError(error, 'Create user')

      expect(response.status).toBe(409)

      const data = await response.json()
      expect(data.error).toBe('A record with this email already exists')
    })

    it('should handle P2002 without target field', async () => {
      const error = {
        code: 'P2002',
        meta: {},
      }

      const response = handleApiError(error, 'Create record')

      expect(response.status).toBe(409)

      const data = await response.json()
      expect(data.error).toBe('A record with this field already exists')
    })

    it('should handle P2003 foreign key constraint', async () => {
      const error = {
        code: 'P2003',
      }

      const response = handleApiError(error, 'Create order')

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Referenced record does not exist')
    })

    it('should handle P2025 record not found', async () => {
      const error = {
        code: 'P2025',
      }

      const response = handleApiError(error, 'Update product')

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.error).toBe('Record not found')
    })
  })

  describe('Generic Errors', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('should handle generic Error in development with message and stack', async () => {
      process.env.NODE_ENV = 'development'

      const error = new Error('Something went wrong')
      const response = handleApiError(error, 'Test operation')

      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.error).toBe('Something went wrong')
      expect(data.stack).toBeDefined()
    })

    it('should hide error details in production', async () => {
      process.env.NODE_ENV = 'production'

      const error = new Error('Internal database error')
      const response = handleApiError(error, 'Test operation')

      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.error).toBe('An unexpected error occurred')
      expect(data.stack).toBeUndefined()
    })

    it('should handle non-Error objects', async () => {
      const error = 'String error message'
      const response = handleApiError(error, 'Test operation')

      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.error).toBe('An unexpected error occurred')
    })

    it('should handle null error', async () => {
      const response = handleApiError(null, 'Test operation')

      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.error).toBe('An unexpected error occurred')
    })

    it('should handle undefined error', async () => {
      const response = handleApiError(undefined, 'Test operation')

      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.error).toBe('An unexpected error occurred')
    })
  })
})

describe('successResponse', () => {
  it('should create success response with 200 status by default', async () => {
    const data = { product: { id: '123', name: 'Test Product' } }
    const response = successResponse(data)

    expect(response.status).toBe(200)

    const responseData = await response.json()
    expect(responseData.success).toBe(true)
    expect(responseData.product).toEqual(data.product)
  })

  it('should create success response with custom status', async () => {
    const data = { product: { id: '123' } }
    const response = successResponse(data, 201)

    expect(response.status).toBe(201)

    const responseData = await response.json()
    expect(responseData.success).toBe(true)
  })

  it('should spread data into response', async () => {
    const data = {
      products: [{ id: '1' }, { id: '2' }],
      pagination: { page: 1, total: 2 },
    }
    const response = successResponse(data)

    const responseData = await response.json()
    expect(responseData.success).toBe(true)
    expect(responseData.products).toEqual(data.products)
    expect(responseData.pagination).toEqual(data.pagination)
  })

  it('should handle empty object data', async () => {
    const response = successResponse({})

    const responseData = await response.json()
    expect(responseData.success).toBe(true)
    expect(Object.keys(responseData)).toEqual(['success'])
  })

  it('should handle array data', async () => {
    const data = { items: [1, 2, 3] }
    const response = successResponse(data)

    const responseData = await response.json()
    expect(responseData.success).toBe(true)
    expect(responseData.items).toEqual([1, 2, 3])
  })
})

describe('errorResponse', () => {
  it('should create error response with 400 status by default', async () => {
    const response = errorResponse('Something went wrong')

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Something went wrong')
  })

  it('should create error response with custom status', async () => {
    const response = errorResponse('Not found', 404)

    expect(response.status).toBe(404)

    const data = await response.json()
    expect(data.error).toBe('Not found')
  })

  it('should include details when provided', async () => {
    const details = { field: 'email', code: 'INVALID_FORMAT' }
    const response = errorResponse('Validation failed', 400, details)

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Validation failed')
    expect(data.details).toEqual(details)
  })

  it('should not include details when not provided', async () => {
    const response = errorResponse('Error message')

    const data = await response.json()
    expect(data.details).toBeUndefined()
  })

  it('should handle different status codes', async () => {
    const testCases = [
      { status: 400, message: 'Bad Request' },
      { status: 401, message: 'Unauthorized' },
      { status: 403, message: 'Forbidden' },
      { status: 404, message: 'Not Found' },
      { status: 500, message: 'Internal Server Error' },
    ]

    for (const { status, message } of testCases) {
      const response = errorResponse(message, status)
      expect(response.status).toBe(status)

      const data = await response.json()
      expect(data.error).toBe(message)
    }
  })
})
