/**
 * Authentication Middleware
 * 
 * Eliminates auth boilerplate repeated across 43 API route files
 * Provides decorators for common auth patterns
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { unauthorized, storeNotFound, handleApiError } from '@/lib/utils/api'
import { logger } from '@/lib/logger'

// Types for authenticated contexts
export interface AuthenticatedContext {
  user: {
    id: string
    email: string
    name?: string | null
    role?: string
  }
  requestId: string
}

export interface VendorContext extends AuthenticatedContext {
  store: {
    id: string
    userId: string
    name: string
    slug: string
    tenantId?: string | null
    Tenant?: {
      id: string
      currentProducts: number
      maxProducts: number
      currentStorageGB: number
      maxStorageGB: number
    } | null
  }
}

export interface AdminContext extends AuthenticatedContext {
  isAdmin: true
}

// API Handler Types
export type ApiHandler<_T = any> = (
  req: NextRequest,
  context: { params?: any }
) => Promise<NextResponse>

export type AuthenticatedApiHandler<_T = any> = (
  req: NextRequest,
  context: AuthenticatedContext & { params?: any }
) => Promise<NextResponse>

export type VendorApiHandler<_T = any> = (
  req: NextRequest,
  context: VendorContext & { params?: any }
) => Promise<NextResponse>

export type AdminApiHandler<_T = any> = (
  req: NextRequest,
  context: AdminContext & { params?: any }
) => Promise<NextResponse>

// Base Authentication Middleware
export function withAuth<T extends Record<string, any> = Record<string, never>>(
  handler: AuthenticatedApiHandler<T>
): ApiHandler<T> {
  return async (req: NextRequest, context: { params?: any } = {}) => {
    const requestId = crypto.randomUUID()
    
    try {
      // Check authentication
      const session = await auth()
      
      if (!session?.user?.id) {
        logger.warn("Unauthorized API access attempt", { 
          url: req.url, 
          requestId 
        })
        return unauthorized()
      }

      // Create authenticated context
      const authContext: AuthenticatedContext = {
        user: {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.name,
          role: (session.user as any).role
        },
        requestId
      }

      logger.info("Authenticated API request", {
        userId: authContext.user.id,
        url: req.url,
        method: req.method,
        requestId
      })

      return await handler(req, { ...authContext, ...context })
    } catch (error) {
      logger.error("Auth middleware error", { error, requestId })
      return handleApiError(error, requestId)
    }
  }
}

// Vendor Store Access Middleware
export function withVendorStore<T extends Record<string, any> = Record<string, never>>(
  handler: VendorApiHandler<T>
): ApiHandler<T> {
  return withAuth(async (req: NextRequest, context: AuthenticatedContext & { params?: any }) => {
    try {
      // Get user's store
      const store = await prisma.vendor_stores.findFirst({
        where: {
          userId: context.user.id,
        },
        include: {
          Tenant: {
            select: {
              id: true,
              currentProducts: true,
              maxProducts: true,
              currentStorageGB: true,
              maxStorageGB: true,
            }
          }
        }
      })

      if (!store) {
        logger.warn("Store not found for authenticated user", {
          userId: context.user.id,
          requestId: context.requestId
        })
        return storeNotFound()
      }

      // Create vendor context
      const vendorContext: VendorContext = {
        ...context,
        store: {
          id: store.id,
          userId: store.userId,
          name: store.name,
          slug: store.slug,
          tenantId: store.tenantId,
          Tenant: store.Tenant
        }
      }

      logger.info("Vendor store access", {
        userId: context.user.id,
        storeId: store.id,
        storeName: store.name,
        requestId: context.requestId
      })

      return await handler(req, vendorContext)
    } catch (error) {
      logger.error("Vendor store middleware error", { 
        error, 
        requestId: context.requestId 
      })
      return handleApiError(error, context.requestId)
    }
  })
}

// Admin Access Middleware
export function withAdmin<T extends Record<string, any> = Record<string, never>>(
  handler: AdminApiHandler<T>
): ApiHandler<T> {
  return withAuth(async (req: NextRequest, context: AuthenticatedContext & { params?: any }) => {
    try {
      // Check if user is admin
      const isAdmin = context.user.role === 'ADMIN' || context.user.role === 'SUPER_ADMIN'
      
      if (!isAdmin) {
        logger.warn("Non-admin attempted admin access", {
          userId: context.user.id,
          role: context.user.role,
          requestId: context.requestId
        })
        return unauthorized("Admin access required")
      }

      const adminContext: AdminContext = {
        ...context,
        isAdmin: true
      }

      logger.info("Admin access granted", {
        userId: context.user.id,
        requestId: context.requestId
      })

      return await handler(req, adminContext)
    } catch (error) {
      logger.error("Admin middleware error", { 
        error, 
        requestId: context.requestId 
      })
      return handleApiError(error, context.requestId)
    }
  })
}

// Specific Product Access Middleware (for product-specific routes)
export function withProductAccess<T extends Record<string, any> = Record<string, never>>(
  handler: (
    req: NextRequest,
    context: VendorContext & { product: any; params?: any }
  ) => Promise<NextResponse>
): ApiHandler<T> {
  return withVendorStore(async (req: NextRequest, context: VendorContext & { params?: any }) => {
    try {
      const productId = context.params?.id

      if (!productId) {
        return handleApiError(new Error("Product ID is required"), context.requestId)
      }

      // Get product and verify ownership
      const product = await prisma.products.findFirst({
        where: {
          id: productId,
          vendorStoreId: context.store.id
        },
        include: {
          images: true,
          variants: true
        }
      })

      if (!product) {
        logger.warn("Product not found or access denied", {
          productId,
          storeId: context.store.id,
          userId: context.user.id,
          requestId: context.requestId
        })
        return storeNotFound() // Use store not found to avoid revealing product existence
      }

      logger.info("Product access granted", {
        productId: product.id,
        productName: product.name,
        storeId: context.store.id,
        requestId: context.requestId
      })

      return await handler(req, { ...context, product })
    } catch (error) {
      logger.error("Product access middleware error", { 
        error, 
        requestId: context.requestId 
      })
      return handleApiError(error, context.requestId)
    }
  })
}

// Rate Limiting Middleware (can be combined with auth)
export function withRateLimit(
  _requests: number = 100,
  _windowMs: number = 60000 // 1 minute
) {
  return function<T extends Record<string, any> = Record<string, never>>(
    middleware: ApiHandler<T>
  ): ApiHandler<T> {
    return async (req: NextRequest, context: { params?: any } = {}) => {
      // Rate limiting logic would go here
      // For now, just pass through to the middleware
      return await middleware(req, context)
    }
  }
}

// Utility to create request ID for non-authenticated routes
export function generateRequestId(): string {
  return crypto.randomUUID()
}