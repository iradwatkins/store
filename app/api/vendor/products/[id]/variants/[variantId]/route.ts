import { NextRequest } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import {
  requireAuth,
  handleApiError,
  successResponse,
} from "@/lib/utils/api"
import { BusinessLogicError } from "@/lib/errors"
import { logger } from "@/lib/logger"

const updateVariantSchema = z.object({
  name: z.string().min(1, "Variant name is required").optional(),
  value: z.string().min(1, "Variant value is required").optional(),
  price: z.number().optional().nullable(),
  sku: z.string().optional().nullable(),
  quantity: z.number().int().min(0, "Quantity must be non-negative").optional(),
  available: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
) {
  try {
    const session = await requireAuth()
    const isAdmin = session.user.role === "ADMIN"

    // Verify variant ownership
    const variant = await prisma.product_variants.findUnique({
      where: { id: params.variantId },
      include: {
        product: {
          include: {
            vendor_stores: true,
          },
        },
      },
    })

    if (!variant) {
      throw new BusinessLogicError("Variant not found")
    }

    // Verify variant belongs to this product
    if (variant.productId !== params.id) {
      throw new BusinessLogicError("Variant does not belong to this product")
    }

    // Check permission
    if (!isAdmin) {
      if (variant.product.vendor_stores.userId !== session.user.id) {
        throw new BusinessLogicError("Forbidden")
      }
    }

    const body = await request.json()
    const validatedData = updateVariantSchema.parse(body)

    // Update variant
    const updatedVariant = await prisma.product_variants.update({
      where: { id: params.variantId },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.value !== undefined && { value: validatedData.value }),
        ...(validatedData.price !== undefined && { price: validatedData.price }),
        ...(validatedData.sku !== undefined && { sku: validatedData.sku }),
        ...(validatedData.quantity !== undefined && { quantity: validatedData.quantity }),
        ...(validatedData.available !== undefined && { available: validatedData.available }),
      },
    })

    logger.info(`${isAdmin ? 'Admin' : 'Vendor'} updated variant: ${updatedVariant.name}`)

    return successResponse({
      message: "Variant updated successfully",
      variant: updatedVariant,
    })
  } catch (error) {
    return handleApiError(error, 'Update variant')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
) {
  try {
    const session = await requireAuth()
    const isAdmin = session.user.role === "ADMIN"

    // Verify variant ownership
    const variant = await prisma.product_variants.findUnique({
      where: { id: params.variantId },
      include: {
        product: {
          include: {
            vendor_stores: true,
            variants: true,
          },
        },
      },
    })

    if (!variant) {
      throw new BusinessLogicError("Variant not found")
    }

    // Verify variant belongs to this product
    if (variant.productId !== params.id) {
      throw new BusinessLogicError("Variant does not belong to this product")
    }

    // Check permission
    if (!isAdmin) {
      if (variant.product.vendor_stores.userId !== session.user.id) {
        throw new BusinessLogicError("Forbidden")
      }
    }

    // Delete variant
    await prisma.product_variants.delete({
      where: { id: params.variantId },
    })

    // If this was the last variant, update product hasVariants flag
    if (variant.product.variants.length === 1) {
      await prisma.products.update({
        where: { id: variant.productId },
        data: { hasVariants: false },
      })
    }

    logger.info(`${isAdmin ? 'Admin' : 'Vendor'} deleted variant: ${variant.name}`)

    return successResponse({
      message: "Variant deleted successfully",
    })
  } catch (error) {
    return handleApiError(error, 'Delete variant')
  }
}
