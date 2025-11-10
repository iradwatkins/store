import { NextRequest } from "next/server"
import prisma from "@/lib/db"
import {
  requireAuth,
  handleApiError,
  successResponse,
} from "@/lib/utils/api"
import { BusinessLogicError } from "@/lib/errors"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const isAdmin = session.user.role === "ADMIN"

    // Admins can view any product, vendors can only view their own
    let product
    if (isAdmin) {
      product = await prisma.products.findUnique({
        where: { id: params.id },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: { orderBy: { createdAt: "asc" } },
          vendor_stores: {
            select: { id: true, name: true, slug: true },
          },
          _count: { select: { orderItems: true } },
        },
      })
    } else {
      const store = await prisma.vendor_stores.findFirst({
        where: { userId: session.user.id },
      })

      if (!store) {
        throw new BusinessLogicError("Store not found")
      }

      product = await prisma.products.findFirst({
        where: {
          id: params.id,
          vendorStoreId: store.id,
        },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: { orderBy: { createdAt: "asc" } },
          _count: { select: { orderItems: true } },
        },
      })
    }

    if (!product) {
      throw new BusinessLogicError("Product not found")
    }

    return successResponse({ product })
  } catch (error) {
    return handleApiError(error, 'Get product')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const isAdmin = session.user.role === "ADMIN"

    // Admins can update any product, vendors can only update their own
    if (!isAdmin) {
      const store = await prisma.vendor_stores.findFirst({
        where: { userId: session.user.id },
      })

      if (!store) {
        throw new BusinessLogicError("Store not found")
      }

      const product = await prisma.products.findFirst({
        where: {
          id: params.id,
          vendorStoreId: store.id,
        },
      })

      if (!product) {
        throw new BusinessLogicError("Product not found")
      }
    } else {
      // Admin: Just verify product exists
      const product = await prisma.products.findUnique({
        where: { id: params.id },
      })

      if (!product) {
        throw new BusinessLogicError("Product not found")
      }
    }

    const body = await request.json()

    // Update product
    const updatedProduct = await prisma.products.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        subcategory: body.subcategory || null,
        price: parseFloat(body.price),
        compareAtPrice: body.compareAtPrice ? parseFloat(body.compareAtPrice) : null,
        sku: body.sku,
        trackInventory: body.trackInventory,
        quantity: body.inventoryQuantity ? parseInt(body.inventoryQuantity) : 0,
        status: body.status,
      },
    })

    return successResponse({
      message: "Product updated successfully",
      product: updatedProduct,
    })
  } catch (error) {
    return handleApiError(error, 'Update product')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const isAdmin = session.user.role === "ADMIN"

    // Admins can delete any product, vendors can only delete their own
    let store
    let product

    if (!isAdmin) {
      store = await prisma.vendor_stores.findFirst({
        where: {
          userId: session.user.id,
        },
      })

      if (!store) {
        throw new BusinessLogicError("Store not found")
      }

      product = await prisma.products.findFirst({
        where: {
          id: params.id,
          vendorStoreId: store.id,
        },
      })

      if (!product) {
        throw new BusinessLogicError("Product not found")
      }
    } else {
      // Admin: Get product and its store
      product = await prisma.products.findUnique({
        where: { id: params.id },
        include: {
          vendor_stores: true,
        },
      })

      if (!product) {
        throw new BusinessLogicError("Product not found")
      }

      store = product.vendor_stores
    }

    // Delete product (cascades to variants and images)
    await prisma.products.delete({
      where: {
        id: params.id,
      },
    })

    // Decrement product count for tenant (if applicable)
    if (store.tenantId) {
      await prisma.tenants.update({
        where: { id: store.tenantId },
        data: { currentProducts: { decrement: 1 } },
      })
    }

    return successResponse({
      message: "Product deleted successfully",
    })
  } catch (error) {
    return handleApiError(error, 'Delete product')
  }
}
