/**
 * Product Addons API
 *
 * GET /api/vendor/products/[id]/addons - List all addons
 * POST /api/vendor/products/[id]/addons - Create new addon
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'
import { logger } from "@/lib/logger"

// Validation schema for creating addons
const createAddonSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.number().min(0),
  isRequired: z.boolean().default(false),
  allowMultiple: z.boolean().default(false),
  maxQuantity: z.number().int().min(1).optional(),
  requiredForVariants: z.array(z.string()).optional(),
  excludedForVariants: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
})

type CreateAddonInput = z.infer<typeof createAddonSchema>

/**
 * GET - Fetch all addons for a product
 */
export async function GET(
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
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendorStore: true,
        addons: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.vendorStore.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      addons: product.addons,
      total: product.addons.length,
    })
  } catch (error: any) {
    logger.error("Error fetching addons:", error)
    return NextResponse.json(
      { error: 'Failed to fetch addons' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new addon
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
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendorStore: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.vendorStore.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await req.json()
    const validatedData = createAddonSchema.parse(body)

    // Create addon
    const addon = await prisma.productAddon.create({
      data: {
        productId,
        storeId: product.vendorStoreId,
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        isRequired: validatedData.isRequired,
        allowMultiple: validatedData.allowMultiple,
        maxQuantity: validatedData.maxQuantity,
        requiredForVariants: validatedData.requiredForVariants || [],
        excludedForVariants: validatedData.excludedForVariants || [],
        imageUrl: validatedData.imageUrl,
        icon: validatedData.icon,
        sortOrder: validatedData.sortOrder,
        isActive: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Addon created successfully',
        addon,
      },
      { status: 201 }
    )
  } catch (error: any) {
    logger.error("Error creating addon:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create addon' },
      { status: 500 }
    )
  }
}
