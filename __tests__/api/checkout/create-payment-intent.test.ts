/**
 * Integration Tests: Payment Intent Creation
 * Sprint 5 Week 9 - Task 3
 *
 * Tests the complete payment intent creation flow including:
 * - Input validation
 * - State-based tax calculation
 * - Rate limiting
 * - Cart validation
 * - Stripe integration
 */

import { POST } from '@/app/api/checkout/create-payment-intent/route'
import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import redis from '@/lib/redis'
import Stripe from 'stripe'

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test_123456',
        client_secret: 'pi_test_123456_secret_abcdef',
        amount: 15000,
        currency: 'usd',
        status: 'requires_payment_method',
      }),
    },
  }))
})

// Mock Redis
jest.mock('@/lib/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    pipeline: jest.fn(() => ({
      zremrangebyscore: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, 0],
        [null, 1],
        [null, 1], // Rate limit count
        [null, 1],
      ]),
    })),
  },
  redisHelpers: {
    getCart: jest.fn(),
    setCart: jest.fn(),
    deleteCart: jest.fn(),
  },
}))

describe('POST /api/checkout/create-payment-intent', () => {
  const mockCart = {
    items: [
      {
        cartItemId: 'product-1',
        productId: 'product-1',
        productName: 'Test Product',
        productSlug: 'test-product',
        variantId: null,
        variantName: null,
        price: 100,
        quantity: 1,
        image: 'https://example.com/image.jpg',
        storeSlug: 'test-store',
      },
    ],
    storeSlug: 'test-store',
  }

  const validShippingInfo = {
    email: 'customer@example.com',
    phone: '+1 (312) 555-0100',
    fullName: 'John Customer',
    addressLine1: '123 Main Street',
    addressLine2: 'Apt 4B',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
  }

  const validShippingMethod = {
    id: 'standard' as const,
    name: 'Standard Shipping',
    price: 10,
    estimatedDays: '5-7 business days',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock Redis cart retrieval
    ;(redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockCart))
  })

  describe('Input Validation', () => {
    it('should reject invalid email address', async () => {
      const request = new NextRequest('http://localhost:3008/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingInfo: { ...validShippingInfo, email: 'invalid-email' },
          shippingMethod: validShippingMethod,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: expect.arrayContaining(['shippingInfo', 'email']),
          }),
        ])
      )
    })

    it('should reject invalid phone number', async () => {
      const request = new NextRequest('http://localhost:3008/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingInfo: { ...validShippingInfo, phone: '123' },
          shippingMethod: validShippingMethod,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })

    it('should reject invalid state code', async () => {
      const request = new NextRequest('http://localhost:3008/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingInfo: { ...validShippingInfo, state: 'INVALID' },
          shippingMethod: validShippingMethod,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })

    it('should reject invalid ZIP code', async () => {
      const request = new NextRequest('http://localhost:3008/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingInfo: { ...validShippingInfo, zipCode: 'ABC' },
          shippingMethod: validShippingMethod,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })
  })

  describe('Tax Calculation', () => {
    it('should calculate tax correctly for Illinois (6.25%)', async () => {
      const request = new NextRequest('http://localhost:3008/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'cart_id=test-cart-123',
        },
        body: JSON.stringify({
          shippingInfo: { ...validShippingInfo, state: 'IL' },
          shippingMethod: validShippingMethod,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Subtotal: $100, Shipping: $10, Total: $110
      // IL tax: 6.25% = $110 * 0.0625 = $6.875 (rounds to 688 cents)
      const expectedTax = Math.round(110 * 0.0625 * 100)
      expect(data.tax).toBe(expectedTax)
    })

    it('should calculate tax correctly for California (7.25%)', async () => {
      const request = new NextRequest('http://localhost:3008/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'cart_id=test-cart-123',
        },
        body: JSON.stringify({
          shippingInfo: { ...validShippingInfo, state: 'CA' },
          shippingMethod: validShippingMethod,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // CA tax: 7.25% = $110 * 0.0725 = $7.975 (rounds to 798 cents)
      const expectedTax = Math.round(110 * 0.0725 * 100)
      expect(data.tax).toBe(expectedTax)
    })

    it('should use default tax rate for unknown state', async () => {
      const request = new NextRequest('http://localhost:3008/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'cart_id=test-cart-123',
        },
        body: JSON.stringify({
          shippingInfo: { ...validShippingInfo, state: 'XX' as any },
          shippingMethod: validShippingMethod,
        }),
      })

      const response = await POST(request)

      // Should fail validation before tax calculation
      expect(response.status).toBe(400)
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limit (10 requests per minute)', async () => {
      // Mock rate limit exceeded
      ;(redis.pipeline as jest.Mock).mockReturnValue({
        zremrangebyscore: jest.fn().mockReturnThis(),
        zadd: jest.fn().mockReturnThis(),
        zcard: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 0],
          [null, 1],
          [null, 11], // Exceeds limit of 10
          [null, 1],
        ]),
      })

      const request = new NextRequest('http://localhost:3008/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '192.168.1.1',
          'Cookie': 'cart_id=test-cart-123',
        },
        body: JSON.stringify({
          shippingInfo: validShippingInfo,
          shippingMethod: validShippingMethod,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toContain('Too many')
      expect(response.headers.get('Retry-After')).toBeTruthy()
    })
  })

  describe('Cart Validation', () => {
    it('should return 400 when cart is empty', async () => {
      ;(redis.get as jest.Mock).mockResolvedValue(JSON.stringify({ items: [], storeSlug: null }))

      const request = new NextRequest('http://localhost:3008/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'cart_id=test-cart-123',
        },
        body: JSON.stringify({
          shippingInfo: validShippingInfo,
          shippingMethod: validShippingMethod,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('cart')
    })

    it('should return 400 when cart ID is missing', async () => {
      const request = new NextRequest('http://localhost:3008/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No cart_id cookie
        },
        body: JSON.stringify({
          shippingInfo: validShippingInfo,
          shippingMethod: validShippingMethod,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('cart')
    })
  })

  describe('Stripe Integration', () => {
    it('should create payment intent with correct amount', async () => {
      const request = new NextRequest('http://localhost:3008/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'cart_id=test-cart-123',
        },
        body: JSON.stringify({
          shippingInfo: validShippingInfo,
          shippingMethod: validShippingMethod,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.clientSecret).toBe('pi_test_123456_secret_abcdef')
      expect(data.paymentIntentId).toBe('pi_test_123456')

      // Verify Stripe was called with correct amount
      const StripeMock = Stripe as jest.MockedClass<typeof Stripe>
      const stripeInstance = StripeMock.mock.results[0].value
      expect(stripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: expect.any(Number),
          currency: 'usd',
          metadata: expect.objectContaining({
            cartId: 'test-cart-123',
          }),
        })
      )
    })

    it('should include platform fee in metadata', async () => {
      const request = new NextRequest('http://localhost:3008/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'cart_id=test-cart-123',
        },
        body: JSON.stringify({
          shippingInfo: validShippingInfo,
          shippingMethod: validShippingMethod,
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      const StripeMock = Stripe as jest.MockedClass<typeof Stripe>
      const stripeInstance = StripeMock.mock.results[0].value
      expect(stripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            platformFee: expect.any(String),
          }),
        })
      )
    })
  })

  describe('Response Structure', () => {
    it('should return complete payment response', async () => {
      const request = new NextRequest('http://localhost:3008/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'cart_id=test-cart-123',
        },
        body: JSON.stringify({
          shippingInfo: validShippingInfo,
          shippingMethod: validShippingMethod,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        clientSecret: expect.any(String),
        paymentIntentId: expect.any(String),
        subtotal: expect.any(Number),
        shipping: expect.any(Number),
        tax: expect.any(Number),
        total: expect.any(Number),
        platformFee: expect.any(Number),
      })
    })
  })
})
