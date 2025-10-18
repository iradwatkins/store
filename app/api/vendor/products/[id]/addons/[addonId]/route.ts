/**
 * Individual Product Addon API
 *
 * PUT /api/vendor/products/[id]/addons/[addonId] - Update addon
 * DELETE /api/vendor/products/[id]/addons/[addonId] - Delete addon
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

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

type UpdateAddonInput = z.infer<typeof updateAddonSchema>

/**
 * PUT - Update an addon
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; addonId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId, addonId } = params

    // Verify addon exists and user owns it
    const addon = await prisma.productAddon.findUnique({
      where: { id: addonId },
      include: {
        product: {
          include: {
            vendorStore: true,
          },
        },
      },
    })

    if (!addon) {
      return NextResponse.json({ error: 'Addon not found' }, { status: 404 })
    }

    if (addon.productId !== productId) {
      return NextResponse.json(
        { error: 'Addon does not belong to this product' },
        { status: 400 }
      )
    }

    if (addon.product?.vendorStore.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await req.json()
    const validatedData = updateAddonSchema.parse(body)

    // Update addon
    const updatedAddon = await prisma.productAddon.update({
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

    return NextResponse.json({
      success: true,
      message: 'Addon updated successfully',
      addon: updatedAddon,
    })
  } catch (error: any) {
    console.error('Error updating addon:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update addon' },
      { status: 500 }
    )
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
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId, addonId } = params

    // Verify addon exists and user owns it
    const addon = await prisma.productAddon.findUnique({
      where: { id: addonId },
      include: {
        product: {
          include: {
            vendorStore: true,
          },
        },
      },
    })

    if (!addon) {
      return NextResponse.json({ error: 'Addon not found' }, { status: 404 })
    }

    if (addon.productId !== productId) {
      return NextResponse.json(
        { error: 'Addon does not belong to this product' },
        { status: 400 }
      )
    }

    if (addon.product?.vendorStore.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete addon (soft delete by setting isActive to false)
    await prisma.productAddon.update({
      where: { id: addonId },
      data: { isActive: false },
    })

    // Or hard delete:
    // await prisma.productAddon.delete({ where: { id: addonId } })

    return NextResponse.json({
      success: true,
      message: 'Addon deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting addon:', error)
    return NextResponse.json(
      { error: 'Failed to delete addon' },
      { status: 500 }
    )
  }
}
