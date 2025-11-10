import { NextRequest } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import {
  requireAdmin,
  handleApiError,
  successResponse,
} from "@/lib/utils/api"
import { NotFoundError, ValidationError, BusinessLogicError } from "@/lib/errors"

const updateProductSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().min(20).optional(),
  category: z.string().optional(),
  subcategory: z.string().nullish(),
  price: z.number().optional(),
  compareAtPrice: z.number().nullish(),
  sku: z.string().nullish(),
  trackInventory: z.boolean().optional(),
  quantity: z.number().int().min(0).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "OUT_OF_STOCK", "ARCHIVED"]).optional(),
})

// GET /api/admin/products/[productId] - Get a single product
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    await requireAdmin()

    const { productId } = params

    const product = await prisma.products.findUnique({
      where: { id: productId },
      include: {
        product_images: {
          orderBy: { sortOrder: "asc" },
        },
        product_variants: {
          orderBy: { createdAt: "asc" },
        },
        vendor_stores: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            store_order_items: true,
            product_reviews: true,
          },
        },
      },
    })

    if (!product) {
      throw new NotFoundError('Product not found')
    }

    return successResponse({ product })
  } catch (error) {
    return handleApiError(error, 'Fetch product (admin)')
  }
}

// PUT /api/admin/products/[productId] - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    await requireAdmin()

    const { productId } = params

    // Verify product exists
    const product = await prisma.products.findUnique({
      where: { id: productId },
      include: {
        vendor_stores: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!product) {
      throw new NotFoundError('Product not found')
    }

    const body = await request.json()
    const validatedData = updateProductSchema.parse(body)

    // Update product
    const updatedProduct = await prisma.products.update({
      where: { id: productId },
      data: validatedData,
    })

    return successResponse({
      message: "Product updated successfully",
      product: updatedProduct,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid input data', error.issues)
    }
    return handleApiError(error, 'Update product (admin)')
  }
}

// PATCH /api/admin/products/[productId] - Toggle product status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    await requireAdmin()

    const { productId } = params

    // Verify product exists
    const product = await prisma.products.findUnique({
      where: { id: productId },
    })

    if (!product) {
      throw new NotFoundError('Product not found')
    }

    const body = await request.json()
    const { status } = body

    if (!status || !["DRAFT", "ACTIVE", "OUT_OF_STOCK", "ARCHIVED"].includes(status)) {
      throw new BusinessLogicError('Invalid status. Must be DRAFT, ACTIVE, OUT_OF_STOCK, or ARCHIVED')
    }

    // Update product status
    const updatedProduct = await prisma.products.update({
      where: { id: productId },
      data: { status },
    })

    return successResponse({
      message: `Product status changed to ${status}`,
      product: updatedProduct,
    })
  } catch (error) {
    return handleApiError(error, 'Update product status (admin)')
  }
}

// DELETE /api/admin/products/[productId] - Delete a product and all related data
export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    await requireAdmin()

    const { productId } = params

    // Verify product exists
    const product = await prisma.products.findUnique({
      where: { id: productId },
      include: {
        vendor_stores: {
          select: {
            id: true,
            name: true,
            tenantId: true,
          },
        },
        _count: {
          select: {
            product_variants: true,
            product_images: true,
            product_reviews: true,
          },
        },
      },
    })

    if (!product) {
      throw new NotFoundError('Product not found')
    }

    // CASCADE DELETION ORDER:
    // 1. Reviews (dependent on product and order items)
    // 2. Order items (dependent on product)
    // 3. Variants (dependent on product)
    // 4. Images (dependent on product)
    // 5. Product itself

    // Delete reviews for this product
    await prisma.product_reviews.deleteMany({
      where: { productId: productId },
    })

    // Delete order items (but not the orders themselves)
    await prisma.store_order_items.deleteMany({
      where: { productId: productId },
    })

    // Delete product variants
    await prisma.product_variants.deleteMany({
      where: { productId: productId },
    })

    // Delete product images
    await prisma.product_images.deleteMany({
      where: { productId: productId },
    })

    // Delete the product
    await prisma.products.delete({
      where: { id: productId },
    })

    // Decrement product count for tenant (if applicable)
    if (product.vendor_stores.tenantId) {
      await prisma.tenants.update({
        where: { id: product.vendor_stores.tenantId },
        data: { currentProducts: { decrement: 1 } },
      })
    }

    return successResponse({
      message: "Product and all related data deleted successfully",
      deletedProduct: {
        id: product.id,
        name: product.name,
        storeName: product.vendor_stores.name,
        variantsDeleted: product._count.product_variants,
        imagesDeleted: product._count.product_images,
        reviewsDeleted: product._count.product_reviews,
      },
    })
  } catch (error) {
    return handleApiError(error, 'Delete product (admin)')
  }
}
