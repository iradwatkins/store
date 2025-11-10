/**
 * Unit Tests: Auth Helper Functions
 *
 * Tests for authentication and authorization helpers
 */

import {
  requireAuth,
  requireVendorStore,
  requireProductOwnership,
} from '@/lib/utils/api/helpers'
import {
  AuthError,
  NotFoundError,
  ForbiddenError,
} from '@/lib/errors'
import prisma from '@/lib/db'

// Mock NextAuth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}))

// Mock Prisma
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    vendor_stores: {
      findFirst: jest.fn(),
    },
    products: {
      findUnique: jest.fn(),
    },
  },
}))

describe('requireAuth', () => {
  const { auth } = require('@/lib/auth')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return session when user is authenticated', async () => {
    const mockSession = {
      user: {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      },
      expires: '2025-12-31',
    }

    auth.mockResolvedValue(mockSession)

    const result = await requireAuth()

    expect(result).toEqual(mockSession)
    expect(auth).toHaveBeenCalledTimes(1)
  })

  it('should throw AuthError when session is null', async () => {
    auth.mockResolvedValue(null)

    await expect(requireAuth()).rejects.toThrow(AuthError)
    await expect(requireAuth()).rejects.toThrow(
      'You must be logged in to access this resource'
    )
  })

  it('should throw AuthError when session is undefined', async () => {
    auth.mockResolvedValue(undefined)

    await expect(requireAuth()).rejects.toThrow(AuthError)
  })

  it('should throw AuthError when session has no user', async () => {
    auth.mockResolvedValue({ expires: '2025-12-31' })

    await expect(requireAuth()).rejects.toThrow(AuthError)
  })

  it('should throw AuthError when user has no id', async () => {
    auth.mockResolvedValue({
      user: { email: 'test@example.com' },
      expires: '2025-12-31',
    })

    await expect(requireAuth()).rejects.toThrow(AuthError)
  })

  it('should throw AuthError when auth() throws', async () => {
    auth.mockRejectedValue(new Error('Auth service unavailable'))

    await expect(requireAuth()).rejects.toThrow('Auth service unavailable')
  })
})

describe('requireVendorStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return vendor store when found and active', async () => {
    const mockStore = {
      id: 'store123',
      name: 'Test Store',
      slug: 'test-store',
      userId: 'user123',
      isActive: true,
      tenantId: 'tenant123',
    }

    ;(prisma.vendor_stores.findFirst as jest.Mock).mockResolvedValue(mockStore)

    const result = await requireVendorStore('user123')

    expect(result).toEqual(mockStore)
    expect(prisma.vendor_stores.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user123' },
      select: {
        id: true,
        name: true,
        slug: true,
        userId: true,
        isActive: true,
        tenantId: true,
      },
    })
  })

  it('should throw NotFoundError when vendor store not found', async () => {
    ;(prisma.vendor_stores.findFirst as jest.Mock).mockResolvedValue(null)

    await expect(requireVendorStore('user123')).rejects.toThrow(NotFoundError)
    await expect(requireVendorStore('user123')).rejects.toThrow(
      'Vendor store not found. Please create a store first.'
    )
  })

  it('should throw ForbiddenError when vendor store is not active', async () => {
    const mockStore = {
      id: 'store123',
      name: 'Test Store',
      slug: 'test-store',
      userId: 'user123',
      isActive: false,
      tenantId: 'tenant123',
    }

    ;(prisma.vendor_stores.findFirst as jest.Mock).mockResolvedValue(mockStore)

    await expect(requireVendorStore('user123')).rejects.toThrow(ForbiddenError)
    await expect(requireVendorStore('user123')).rejects.toThrow(
      'Your store is not active. Please contact support.'
    )
  })

  it('should handle database errors', async () => {
    ;(prisma.vendor_stores.findFirst as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    )

    await expect(requireVendorStore('user123')).rejects.toThrow(
      'Database connection failed'
    )
  })

  it('should handle different user IDs', async () => {
    const userIds = ['user1', 'user2', 'user3']

    for (const userId of userIds) {
      const mockStore = {
        id: `store_${userId}`,
        name: `Store for ${userId}`,
        slug: `store-${userId}`,
        userId,
        isActive: true,
        tenantId: 'tenant123',
      }

      ;(prisma.vendor_stores.findFirst as jest.Mock).mockResolvedValue(mockStore)

      const result = await requireVendorStore(userId)

      expect(result.userId).toBe(userId)
      expect(prisma.vendor_stores.findFirst).toHaveBeenCalledWith({
        where: { userId },
        select: expect.any(Object),
      })
    }
  })
})

describe('requireProductOwnership', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return product when user owns it', async () => {
    const mockProduct = {
      id: 'product123',
      name: 'Test Product',
      vendor_stores: {
        id: 'store123',
        userId: 'user123',
        name: 'Test Store',
      },
    }

    ;(prisma.products.findUnique as jest.Mock).mockResolvedValue(mockProduct)

    const result = await requireProductOwnership('product123', 'user123')

    expect(result).toEqual(mockProduct)
    expect(prisma.products.findUnique).toHaveBeenCalledWith({
      where: { id: 'product123' },
      include: {
        vendor_stores: {
          select: { id: true, userId: true, name: true },
        },
      },
    })
  })

  it('should throw NotFoundError when product not found', async () => {
    ;(prisma.products.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(
      requireProductOwnership('product123', 'user123')
    ).rejects.toThrow(NotFoundError)
    await expect(
      requireProductOwnership('product123', 'user123')
    ).rejects.toThrow('Product not found')
  })

  it('should throw ForbiddenError when user does not own product', async () => {
    const mockProduct = {
      id: 'product123',
      name: 'Test Product',
      vendor_stores: {
        id: 'store123',
        userId: 'otherUser',
        name: 'Other Store',
      },
    }

    ;(prisma.products.findUnique as jest.Mock).mockResolvedValue(mockProduct)

    await expect(
      requireProductOwnership('product123', 'user123')
    ).rejects.toThrow(ForbiddenError)
    await expect(
      requireProductOwnership('product123', 'user123')
    ).rejects.toThrow('You do not have permission to access this product')
  })

  it('should accept custom include parameter', async () => {
    const mockProduct = {
      id: 'product123',
      name: 'Test Product',
      vendor_stores: {
        id: 'store123',
        userId: 'user123',
        name: 'Test Store',
      },
      product_variants: [{ id: 'variant1' }],
      product_images: [{ id: 'image1' }],
    }

    const customInclude = {
      product_variants: true,
      product_images: true,
    }

    ;(prisma.products.findUnique as jest.Mock).mockResolvedValue(mockProduct)

    const result = await requireProductOwnership('product123', 'user123', customInclude)

    expect(result).toEqual(mockProduct)
    expect(prisma.products.findUnique).toHaveBeenCalledWith({
      where: { id: 'product123' },
      include: {
        vendor_stores: {
          select: { id: true, userId: true, name: true },
        },
        product_variants: true,
        product_images: true,
      },
    })
  })

  it('should handle database errors', async () => {
    ;(prisma.products.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    )

    await expect(
      requireProductOwnership('product123', 'user123')
    ).rejects.toThrow('Database connection failed')
  })

  it('should work with different product and user IDs', async () => {
    const testCases = [
      { productId: 'prod1', userId: 'user1' },
      { productId: 'prod2', userId: 'user2' },
      { productId: 'prod3', userId: 'user3' },
    ]

    for (const { productId, userId } of testCases) {
      const mockProduct = {
        id: productId,
        name: `Product ${productId}`,
        vendor_stores: {
          id: `store_${userId}`,
          userId,
          name: `Store ${userId}`,
        },
      }

      ;(prisma.products.findUnique as jest.Mock).mockResolvedValue(mockProduct)

      const result = await requireProductOwnership(productId, userId)

      expect(result.id).toBe(productId)
      expect(result.vendor_stores.userId).toBe(userId)
    }
  })
})

describe('Integration: requireAuth + requireVendorStore', () => {
  const { auth } = require('@/lib/auth')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should work together for typical API route flow', async () => {
    // Mock authenticated session
    const mockSession = {
      user: {
        id: 'user123',
        email: 'vendor@example.com',
      },
      expires: '2025-12-31',
    }
    auth.mockResolvedValue(mockSession)

    // Mock vendor store
    const mockStore = {
      id: 'store123',
      name: 'Vendor Store',
      slug: 'vendor-store',
      userId: 'user123',
      isActive: true,
      tenantId: 'tenant123',
    }
    ;(prisma.vendor_stores.findFirst as jest.Mock).mockResolvedValue(mockStore)

    // Execute typical API route flow
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    expect(session.user.id).toBe('user123')
    expect(vendorStore.id).toBe('store123')
    expect(vendorStore.userId).toBe('user123')
  })

  it('should fail at requireAuth when not authenticated', async () => {
    auth.mockResolvedValue(null)

    await expect(async () => {
      const session = await requireAuth()
      await requireVendorStore(session.user.id)
    }).rejects.toThrow(AuthError)

    // requireVendorStore should never be called
    expect(prisma.vendor_stores.findFirst).not.toHaveBeenCalled()
  })

  it('should fail at requireVendorStore when store not found', async () => {
    const mockSession = {
      user: { id: 'user123' },
      expires: '2025-12-31',
    }
    auth.mockResolvedValue(mockSession)
    ;(prisma.vendor_stores.findFirst as jest.Mock).mockResolvedValue(null)

    const session = await requireAuth()

    await expect(requireVendorStore(session.user.id)).rejects.toThrow(
      NotFoundError
    )
  })
})

describe('Integration: requireAuth + requireProductOwnership', () => {
  const { auth } = require('@/lib/auth')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should work together for product access flow', async () => {
    const mockSession = {
      user: { id: 'user123' },
      expires: '2025-12-31',
    }
    auth.mockResolvedValue(mockSession)

    const mockProduct = {
      id: 'product123',
      name: 'My Product',
      vendor_stores: {
        id: 'store123',
        userId: 'user123',
        name: 'My Store',
      },
    }
    ;(prisma.products.findUnique as jest.Mock).mockResolvedValue(mockProduct)

    const session = await requireAuth()
    const product = await requireProductOwnership('product123', session.user.id)

    expect(product.id).toBe('product123')
    expect(product.vendor_stores.userId).toBe('user123')
  })

  it('should fail when user tries to access another users product', async () => {
    const mockSession = {
      user: { id: 'user123' },
      expires: '2025-12-31',
    }
    auth.mockResolvedValue(mockSession)

    const mockProduct = {
      id: 'product123',
      name: 'Other Product',
      vendor_stores: {
        id: 'store456',
        userId: 'otherUser',
        name: 'Other Store',
      },
    }
    ;(prisma.products.findUnique as jest.Mock).mockResolvedValue(mockProduct)

    const session = await requireAuth()

    await expect(
      requireProductOwnership('product123', session.user.id)
    ).rejects.toThrow(ForbiddenError)
  })
})
