import { POST } from '@/app/api/cart/add/route'
import { mockRequest, mockSession, mockProduct } from '@/__tests__/utils/test-helpers'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

jest.mock('next-auth')
jest.mock('@/lib/prisma')

describe('/api/cart/add', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST - Add to Cart', () => {
    const validCartItem = {
      productId: 'product-123',
      quantity: 2,
      variantId: null,
    }

    it('should add product to cart for authenticated user', async () => {
      const session = mockSession()
      const product = mockProduct()

      ;(getServerSession as jest.Mock).mockResolvedValue(session)
      ;(prisma.products.findUnique as jest.Mock).mockResolvedValue(product)
      ;(prisma.cartItem.create as jest.Mock).mockResolvedValue({
        id: 'cart-item-123',
        userId: session.user.id,
        ...validCartItem,
      })

      const request = mockRequest({
        method: 'POST',
        body: validCartItem,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.item.quantity).toBe(2)
    })

    it('should reject if product not found', async () => {
      const session = mockSession()
      ;(getServerSession as jest.Mock).mockResolvedValue(session)
      ;(prisma.products.findUnique as jest.Mock).mockResolvedValue(null)

      const request = mockRequest({
        method: 'POST',
        body: validCartItem,
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
    })

    it('should reject if product is out of stock', async () => {
      const session = mockSession()
      const outOfStockProduct = mockProduct({ quantity: 0, trackInventory: true })

      ;(getServerSession as jest.Mock).mockResolvedValue(session)
      ;(prisma.products.findUnique as jest.Mock).mockResolvedValue(outOfStockProduct)

      const request = mockRequest({
        method: 'POST',
        body: validCartItem,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('stock')
    })

    it('should reject if requested quantity exceeds available stock', async () => {
      const session = mockSession()
      const product = mockProduct({ quantity: 5, trackInventory: true })

      ;(getServerSession as jest.Mock).mockResolvedValue(session)
      ;(prisma.products.findUnique as jest.Mock).mockResolvedValue(product)

      const request = mockRequest({
        method: 'POST',
        body: {
          ...validCartItem,
          quantity: 10, // Exceeds available stock of 5
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('stock')
    })

    it('should allow adding product with trackInventory disabled', async () => {
      const session = mockSession()
      const product = mockProduct({ quantity: 0, trackInventory: false })

      ;(getServerSession as jest.Mock).mockResolvedValue(session)
      ;(prisma.products.findUnique as jest.Mock).mockResolvedValue(product)
      ;(prisma.cartItem.create as jest.Mock).mockResolvedValue({
        id: 'cart-item-123',
        userId: session.user.id,
        ...validCartItem,
      })

      const request = mockRequest({
        method: 'POST',
        body: validCartItem,
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should reject invalid quantity', async () => {
      const session = mockSession()
      ;(getServerSession as jest.Mock).mockResolvedValue(session)

      const request = mockRequest({
        method: 'POST',
        body: {
          productId: 'product-123',
          quantity: 0, // Invalid quantity
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should update existing cart item if product already in cart', async () => {
      const session = mockSession()
      const product = mockProduct({ quantity: 100 })

      ;(getServerSession as jest.Mock).mockResolvedValue(session)
      ;(prisma.products.findUnique as jest.Mock).mockResolvedValue(product)
      ;(prisma.cartItem.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-cart-item',
        quantity: 3,
      })
      ;(prisma.cartItem.update as jest.Mock).mockResolvedValue({
        id: 'existing-cart-item',
        quantity: 5, // 3 + 2
      })

      const request = mockRequest({
        method: 'POST',
        body: validCartItem, // quantity: 2
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.item.quantity).toBe(5)
    })
  })
})
