/**
 * Individual Product Addon API
 *
 * PUT /api/vendor/products/[id]/addons/[addonId] - Update addon
 * DELETE /api/vendor/products/[id]/addons/[addonId] - Delete addon
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import {
  requireAuth,
  handleApiError,
  successResponse,
} from '@/lib/utils/api'
import { BusinessLogicError } from '@/lib/errors'

// Validation schema for updating addons
const updateAddonSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  isRequired: z.boolean().optional(),
  allowMultiple: z.boolean().optional(),
  maxQuantity: z.number().int().min(1).optional(),
  requiredForVariants: z.array(z.string()).optional(),
  excludedForVariants: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})

// type UpdateAddonInput = z.infer<typeof updateAddonSchema> // Unused type

/**
 * PUT - Update an addon
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; addonId: string } }
) {
  try {
    const session = await requireAuth()
    const { id: productId, addonId } = params

    // Verify addon exists and user owns it
    const addon = await prisma.product_addons.findUnique({
      where: { id: addonId },
      include: {
        product: {
          include: {
            vendor_stores: true,
          },
        },
      },
    })

    if (!addon) {
      throw new BusinessLogicError('Addon not found')
    }

    if (addon.productId !== productId) {
      throw new BusinessLogicError('Addon does not belong to this product')
    }

    if (addon.product?.vendor_stores.userId !== session.user.id) {
      throw new BusinessLogicError('Forbidden')
    }

    // Parse and validate request body
    const body = await req.json()
    const validatedData = updateAddonSchema.parse(body)

    // Update addon
    const updatedAddon = await prisma.product_addons.update({
      where: { id: addonId },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        isRequired: validatedData.isRequired,
        allowMultiple: validatedData.allowMultiple,
        maxQuantity: validatedData.maxQuantity,
        requiredForVariants: validatedData.requiredForVariants,
        excludedForVariants: validatedData.excludedForVariants,
        imageUrl: validatedData.imageUrl,
        icon: validatedData.icon,
        sortOrder: validatedData.sortOrder,
        isActive: validatedData.isActive,
      },
    })

    return successResponse({
      message: 'Addon updated successfully',
      addon: updatedAddon,
    })
  } catch (error: any) {
    return handleApiError(error, 'Update addon')
  }
}

/**
 * DELETE - Delete an addon
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; addonId: string } }
) {
  try {
    const session = await requireAuth()
    const { id: productId, addonId } = params

    // Verify addon exists and user owns it
    const addon = await prisma.product_addons.findUnique({
      where: { id: addonId },
      include: {
        product: {
          include: {
            vendor_stores: true,
          },
        },
      },
    })

    if (!addon) {
      throw new BusinessLogicError('Addon not found')
    }

    if (addon.productId !== productId) {
      throw new BusinessLogicError('Addon does not belong to this product')
    }

    if (addon.product?.vendor_stores.userId !== session.user.id) {
      throw new BusinessLogicError('Forbidden')
    }

    // Delete addon (soft delete by setting isActive to false)
    await prisma.product_addons.update({
      where: { id: addonId },
      data: { isActive: false },
    })

    // Or hard delete:
    // await prisma.product_addons.delete({ where: { id: addonId } })

    return successResponse({
      message: 'Addon deleted successfully',
    })
  } catch (error: any) {
    return handleApiError(error, 'Delete addon')
  }
}
