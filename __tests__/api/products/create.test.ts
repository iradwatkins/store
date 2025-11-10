import { POST } from '@/app/api/dashboard/products/route'
import { mockRequest, mockVendorSession, expectUnauthorized } from '@/__tests__/utils/test-helpers'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

jest.mock('next-auth')
jest.mock('@/lib/prisma')

describe('/api/dashboard/products', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST - Create Product', () => {
    const validProductData = {
      name: 'Test Product',
      description: 'Test description',
      price: 29.99,
      compareAtPrice: 39.99,
      quantity: 100,
      category: 'CLOTHING',
      sku: 'TEST-SKU-001',
      trackInventory: true,
      taxable: true,
      requiresShipping: true,
      variantTypes: [],
      useMultiVariants: false,
    }

    it('should create product for authenticated vendor', async () => {
      const session = mockVendorSession()
      ;(getServerSession as jest.Mock).mockResolvedValue(session)
      ;(prisma.products.create as jest.Mock).mockResolvedValue({
        id: 'product-123',
        vendorStoreId: session.user.vendor_stores.id,
        slug: 'test-product',
        ...validProductData,
        price: new Decimal(validProductData.price),
        compareAtPrice: new Decimal(validProductData.compareAtPrice),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const request = mockRequest({
        method: 'POST',
        body: validProductData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.product.name).toBe('Test Product')
      expect(data.product.vendor_storesId).toBe(session.user.vendor_stores.id)
    })

    it('should reject unauthenticated requests', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = mockRequest({
        method: 'POST',
        body: validProductData,
      })

      const response = await POST(request)

      await expectUnauthorized(response)
    })

    it('should reject non-vendor users', async () => {
      const customerSession = mockVendorSession({
        user: { role: 'CUSTOMER', vendorStore: null },
      })
      ;(getServerSession as jest.Mock).mockResolvedValue(customerSession)

      const request = mockRequest({
        method: 'POST',
        body: validProductData,
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
    })

    it('should validate required fields', async () => {
      const session = mockVendorSession()
      ;(getServerSession as jest.Mock).mockResolvedValue(session)

      const request = mockRequest({
        method: 'POST',
        body: {
          // Missing required fields
          name: 'Test Product',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should validate price is positive', async () => {
      const session = mockVendorSession()
      ;(getServerSession as jest.Mock).mockResolvedValue(session)

      const request = mockRequest({
        method: 'POST',
        body: {
          ...validProductData,
          price: -10, // Invalid negative price
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should generate unique slug for product', async () => {
      const session = mockVendorSession()
      ;(getServerSession as jest.Mock).mockResolvedValue(session)

      const mockCreate = jest.fn().mockResolvedValue({
        id: 'product-123',
        slug: 'test-product',
        ...validProductData,
      })
      ;(prisma.products.create as jest.Mock) = mockCreate

      const request = mockRequest({
        method: 'POST',
        body: validProductData,
      })

      await POST(request)

      expect(mockCreate).toHaveBeenCalled()
      const createCall = mockCreate.mock.calls[0][0]
      expect(createCall.data.slug).toBeTruthy()
    })
  })
})
