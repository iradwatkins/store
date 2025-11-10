/**
 * Bulk Variant Operations API
 *
 * PATCH /api/vendor/products/[id]/variants/bulk
 * - Update multiple variant combinations at once
 * - Supports filtering by variant type/value
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { logger } from "@/lib/logger"

// Validation schema for bulk updates
const bulkUpdateSchema = z.object({
  filter: z
    .object({
      type: z.string().optional(),
      value: z.string().optional(),
      combinationKeys: z.array(z.string()).optional(),
    })
    .optional(),
  updates: z.object({
    price: z.number().optional(),
    compareAtPrice: z.number().optional(),
    quantity: z.number().int().min(0).optional(),
    available: z.boolean().optional(),
    sku: z.string().optional(),
    imageUrl: z.string().optional(),
  }),
  applyToAll: z.boolean().default(false),
})

// type BulkUpdateInput = z.infer<typeof bulkUpdateSchema> // Unused type

/**
 * PATCH - Bulk update variant combinations
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const productId = params.id

    // Verify product ownership
    const product = await prisma.products.findUnique({
      where: { id: productId },
      include: {
        vendor_stores: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.vendor_stores.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await req.json()
    const validatedData = bulkUpdateSchema.parse(body)

    const { filter, updates, applyToAll } = validatedData

    // Build where clause
    const where: Prisma.VariantCombinationWhereInput = {
      productId,
    }

    if (!applyToAll && filter) {
      if (filter.combinationKeys && filter.combinationKeys.length > 0) {
        // Update specific combinations
        where.combinationKey = {
          in: filter.combinationKeys,
        }
      } else if (filter.type && filter.value) {
        // Update combinations containing specific option (e.g., all "Large" sizes)
        where.optionValues = {
          path: [filter.type],
          equals: filter.value,
        }
      } else if (filter.type) {
        // Update all combinations with a specific type
        where.optionValues = {
          path: [filter.type],
          not: Prisma.AnyNull,
        }
      }
    }

    // Prepare update data
    const updateData: Prisma.VariantCombinationUpdateInput = {}

    if (updates.price !== undefined) {
      updateData.price = updates.price
    }
    if (updates.compareAtPrice !== undefined) {
      updateData.compareAtPrice = updates.compareAtPrice
    }
    if (updates.quantity !== undefined) {
      updateData.quantity = updates.quantity
      updateData.inStock = updates.quantity > 0
    }
    if (updates.available !== undefined) {
      updateData.available = updates.available
    }
    if (updates.sku !== undefined) {
      updateData.sku = updates.sku
    }
    if (updates.imageUrl !== undefined) {
      updateData.imageUrl = updates.imageUrl
    }

    // Perform bulk update
    const result = await prisma.variant_combinations.updateMany({
      where,
      data: updateData as any,
    })

    return NextResponse.json({
      success: true,
      message: `Updated ${result.count} variant combinations`,
      updated: result.count,
    })
  } catch (error: any) {
    logger.error("Error bulk updating variants:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to bulk update variants' },
      { status: 500 }
    )
  }
}

/**
 * POST - Bulk create/update variant combinations
 * Useful for importing or syncing variants
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const productId = params.id

    // Verify product ownership
    const product = await prisma.products.findUnique({
      where: { id: productId },
      include: {
        vendor_stores: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.vendor_stores.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse request body
    const body = await req.json()
    const { variants } = body

    if (!Array.isArray(variants)) {
      return NextResponse.json(
        { error: 'variants must be an array' },
        { status: 400 }
      )
    }

    // Upsert each variant
    const results = await prisma.$transaction(
      variants.map((variant: any) => {
        const combinationKey = variant.combinationKey

        return prisma.variant_combinations.upsert({
          where: {
            productId_combinationKey: {
              productId,
              combinationKey,
            },
          },
          create: {
            productId,
            combinationKey,
            optionValues: variant.optionValues,
            sku: variant.sku,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
            quantity: variant.quantity ?? 0,
            available: variant.available ?? true,
            inStock: (variant.quantity ?? 0) > 0,
            imageUrl: variant.imageUrl,
          },
          update: {
            sku: variant.sku,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
            quantity: variant.quantity ?? 0,
            available: variant.available ?? true,
            inStock: (variant.quantity ?? 0) > 0,
            imageUrl: variant.imageUrl,
          },
        })
      })
    )

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} variants`,
      processed: results.length,
    })
  } catch (error: any) {
    logger.error("Error bulk creating/updating variants:", error)
    return NextResponse.json(
      { error: 'Failed to process variants' },
      { status: 500 }
    )
  }
}
