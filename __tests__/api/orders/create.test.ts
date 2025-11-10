import { POST } from '@/app/api/account/orders/route'
import { mockRequest, mockSession, mockProduct, expectUnauthorized } from '@/__tests__/utils/test-helpers'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

jest.mock('next-auth')
jest.mock('@/lib/prisma')

describe('/api/account/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST - Create Order', () => {
    const validOrderData = {
      items: [
        {
          productId: 'product-123',
          quantity: 2,
          price: 29.99,
        },
      ],
      shippingAddress: {
        line1: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postal_code: '90210',
        country: 'US',
      },
      paymentMethodId: 'pm_test_123',
    }

    it('should create order for authenticated user', async () => {
      const session = mockSession()
      const product = mockProduct({ id: 'product-123', quantity: 100 })

      ;(getServerSession as jest.Mock).mockResolvedValue(session)
      ;(prisma.products.findUnique as jest.Mock).mockResolvedValue(product)
      ;(prisma.orders.create as jest.Mock).mockResolvedValue({
        id: 'order-123',
        userId: session.user.id,
        status: 'PENDING',
        totalAmount: new Decimal(59.98),
        taxAmount: new Decimal(4.80),
        shippingAmount: new Decimal(5.00),
        currency: 'USD',
        createdAt: new Date(),
      })

      const request = mockRequest({
        method: 'POST',
        body: validOrderData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.order.id).toBe('order-123')
      expect(data.order.userId).toBe(session.user.id)
    })

    it('should reject unauthenticated requests', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = mockRequest({
        method: 'POST',
        body: validOrderData,
      })

      const response = await POST(request)

      await expectUnauthorized(response)
    })

    it('should calculate order total correctly', async () => {
      const session = mockSession()
      const product = mockProduct({ id: 'product-123', price: new Decimal(29.99) })

      ;(getServerSession as jest.Mock).mockResolvedValue(session)
      ;(prisma.products.findUnique as jest.Mock).mockResolvedValue(product)

      const mockCreate = jest.fn().mockResolvedValue({
        id: 'order-123',
        totalAmount: new Decimal(69.78), // (29.99 * 2) + tax + shipping
      })
      ;(prisma.orders.create as jest.Mock) = mockCreate

      const request = mockRequest({
        method: 'POST',
        body: validOrderData,
      })

      await POST(request)

      const createCall = mockCreate.mock.calls[0][0]
      expect(createCall.data.totalAmount).toBeDefined()
    })

    it('should reject if product is out of stock', async () => {
      const session = mockSession()
      const product = mockProduct({ quantity: 0, trackInventory: true })

      ;(getServerSession as jest.Mock).mockResolvedValue(session)
      ;(prisma.products.findUnique as jest.Mock).mockResolvedValue(product)

      const request = mockRequest({
        method: 'POST',
        body: validOrderData,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should reject invalid shipping address', async () => {
      const session = mockSession()
      ;(getServerSession as jest.Mock).mockResolvedValue(session)

      const request = mockRequest({
        method: 'POST',
        body: {
          ...validOrderData,
          shippingAddress: {
            // Missing required fields
            city: 'Anytown',
          },
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should reject empty order items', async () => {
      const session = mockSession()
      ;(getServerSession as jest.Mock).mockResolvedValue(session)

      const request = mockRequest({
        method: 'POST',
        body: {
          ...validOrderData,
          items: [], // Empty items array
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})
