import { Decimal } from '@prisma/client/runtime/library'
import { UserRole, ProductStatus, OrderStatus } from '@prisma/client'

/**
 * Test helper utilities for creating mock data
 */

export const mockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'CUSTOMER' as UserRole,
  password: '$2a$10$hashedpassword',
  emailVerified: null,
  image: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const mockVendorStore = (overrides = {}) => ({
  id: 'store-123',
  ownerId: 'user-123',
  name: 'Test Store',
  slug: 'test-store',
  description: 'A test store',
  logoUrl: null,
  bannerUrl: null,
  isActive: true,
  stripeAccountId: null,
  stripeChargesEnabled: false,
  stripeDetailsSubmitted: false,
  squareLocationId: null,
  squareAccessToken: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const mockProduct = (overrides = {}) => ({
  id: 'product-123',
  vendorStoreId: 'store-123',
  name: 'Test Product',
  slug: 'test-product',
  description: 'A test product',
  price: new Decimal(29.99),
  compareAtPrice: new Decimal(39.99),
  quantity: 100,
  sku: 'TEST-SKU-123',
  status: 'ACTIVE' as ProductStatus,
  category: 'CLOTHING',
  subcategory: null,
  trackInventory: true,
  taxable: true,
  taxCode: null,
  weight: null,
  weightUnit: null,
  requiresShipping: true,
  variantTypes: [],
  useMultiVariants: false,
  metaTitle: null,
  metaDescription: null,
  tags: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const mockOrder = (overrides = {}) => ({
  id: 'order-123',
  userId: 'user-123',
  vendorStoreId: 'store-123',
  status: 'PENDING' as OrderStatus,
  totalAmount: new Decimal(29.99),
  taxAmount: new Decimal(2.40),
  shippingAmount: new Decimal(5.00),
  discountAmount: new Decimal(0),
  currency: 'USD',
  stripePaymentIntentId: null,
  stripeChargeId: null,
  squareOrderId: null,
  squarePaymentId: null,
  shippingAddress: null,
  billingAddress: null,
  customerEmail: 'test@example.com',
  customerName: 'Test User',
  trackingNumber: null,
  carrierName: null,
  notes: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const mockSession = (overrides = {}) => ({
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'CUSTOMER' as UserRole,
    image: null,
    ...overrides.user,
  },
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  ...overrides,
})

export const mockAdminSession = (overrides = {}) =>
  mockSession({
    user: {
      id: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN' as UserRole,
      ...overrides.user,
    },
    ...overrides,
  })

export const mockVendorSession = (overrides = {}) =>
  mockSession({
    user: {
      id: 'vendor-123',
      email: 'vendor@example.com',
      name: 'Vendor User',
      role: 'VENDOR' as UserRole,
      vendorStore: {
        id: 'store-123',
        slug: 'test-store',
        name: 'Test Store',
      },
      ...overrides.user,
    },
    ...overrides,
  })

/**
 * Mock Next.js Request object
 */
export const mockRequest = (options: {
  method?: string
  body?: any
  headers?: Record<string, string>
  url?: string
} = {}) => {
  const { method = 'GET', body = null, headers = {}, url = 'http://localhost:3000' } = options

  return {
    method,
    headers: new Headers(headers),
    json: async () => body,
    text: async () => JSON.stringify(body),
    url,
  } as unknown as Request
}

/**
 * Mock Next.js Response helpers
 */
export const getResponseJson = async (response: Response) => {
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

export const expectUnauthorized = async (response: Response) => {
  expect(response.status).toBe(401)
  const data = await getResponseJson(response)
  expect(data.error).toBeTruthy()
}

export const expectBadRequest = async (response: Response) => {
  expect(response.status).toBe(400)
  const data = await getResponseJson(response)
  expect(data.error).toBeTruthy()
}

export const expectSuccess = async (response: Response) => {
  expect(response.status).toBe(200)
  const data = await getResponseJson(response)
  return data
}

/**
 * Sleep utility for async tests
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
