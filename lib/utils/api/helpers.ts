/**
 * API Helper Functions
 *
 * Simple helper functions for API routes that throw custom errors
 * These work alongside the existing decorator-based middleware
 */

import type { Session } from 'next-auth'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { AuthError, ForbiddenError, NotFoundError } from '@/lib/errors'

/**
 * Simple auth check that throws on failure
 * Use this for routes that don't need the full middleware pattern
 */
export async function requireAuth(): Promise<Session> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new AuthError('You must be logged in to access this resource')
  }

  return session
}

/**
 * Require admin role or throw
 * Use this for admin-only routes
 */
export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth()

  if (session.user.role !== 'ADMIN') {
    throw new ForbiddenError('Admin access required')
  }

  return session
}

/**
 * Get vendor store or throw
 */
export async function requireVendorStore(userId: string) {
  const vendorStore = await prisma.vendor_stores.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      slug: true,
      userId: true,
      isActive: true,
      tenantId: true,
    },
  })

  if (!vendorStore) {
    throw new NotFoundError('Vendor store not found. Please create a store first.')
  }

  if (!vendorStore.isActive) {
    throw new ForbiddenError('Your store is not active. Please contact support.')
  }

  return vendorStore
}

/**
 * Verify product ownership
 */
export async function requireProductOwnership(
  productId: string,
  userId: string,
  include?: any
) {
  const product = await prisma.products.findUnique({
    where: { id: productId },
    include: {
      vendor_stores: {
        select: {
          id: true,
          userId: true,
          name: true,
        },
      },
      ...include,
    },
  })

  if (!product) {
    throw new NotFoundError('Product not found')
  }

  if (product.vendor_stores.userId !== userId) {
    throw new ForbiddenError('You do not have permission to access this product')
  }

  return product
}
