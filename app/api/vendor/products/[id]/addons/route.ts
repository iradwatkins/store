/**
 * Product Addons API
 *
 * GET /api/vendor/products/[id]/addons - List all addons
 * POST /api/vendor/products/[id]/addons - Create new addon
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import {
  requireAuth,
  handleApiError,
  successResponse,
  generateId,
} from '@/lib/utils/api'
import { BusinessLogicError } from '@/lib/errors'

// Validation schema for creating addons
const createAddonSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.number().min(0),
  fieldType: z.enum(["TEXT", "TEXTAREA", "NUMBER", "SELECT", "CHECKBOX", "RADIO", "DATE", "FILE", "COLOR", "IMAGE_BUTTONS"]).default("TEXT"),
  priceType: z.enum(["FIXED", "PERCENTAGE", "FORMULA"]).default("FIXED"),
  isRequired: z.boolean().default(false),
  allowMultiple: z.boolean().default(false),
  maxQuantity: z.number().int().min(1).optional(),
  options: z.any().optional(),
  conditionalLogic: z.any().optional(),
  priceFormula: z.string().optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  requiredForVariants: z.array(z.string()).optional(),
  excludedForVariants: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
})

// type CreateAddonInput = z.infer<typeof createAddonSchema> // Unused type

/**
 * GET - Fetch all addons for a product
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const productId = params.id

    // Verify product ownership
    const product = await prisma.products.findUnique({
      where: { id: productId },
      include: {
        vendor_stores: true,
        product_addons: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!product) {
      throw new BusinessLogicError('Product not found')
    }

    if (product.vendor_stores.userId !== session.user.id) {
      throw new BusinessLogicError('Forbidden')
    }

    return successResponse({
      product_addons: product.product_addons,
      total: product.product_addons.length,
    })
  } catch (error: any) {
    return handleApiError(error, 'Fetch product addons')
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
    const session = await requireAuth()
    const productId = params.id

    // Verify product ownership
    const product = await prisma.products.findUnique({
      where: { id: productId },
      include: {
        vendor_stores: true,
      },
    })

    if (!product) {
      throw new BusinessLogicError('Product not found')
    }

    if (product.vendor_stores.userId !== session.user.id) {
      throw new BusinessLogicError('Forbidden')
    }

    // Parse and validate request body
    const body = await req.json()
    const validatedData = createAddonSchema.parse(body)

    // Create addon
    const addon = await prisma.product_addons.create({
      data: {
        id: generateId('addon'),
        productId,
        storeId: product.vendor_storesId,
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        fieldType: validatedData.fieldType,
        priceType: validatedData.priceType,
        isRequired: validatedData.isRequired,
        allowMultiple: validatedData.allowMultiple,
        maxQuantity: validatedData.maxQuantity,
        options: validatedData.options,
        conditionalLogic: validatedData.conditionalLogic,
        priceFormula: validatedData.priceFormula,
        minValue: validatedData.minValue,
        maxValue: validatedData.maxValue,
        requiredForVariants: validatedData.requiredForVariants,
        excludedForVariants: validatedData.excludedForVariants,
        imageUrl: validatedData.imageUrl,
        icon: validatedData.icon,
        sortOrder: validatedData.sortOrder,
        isActive: true,
      },
    })

    return successResponse(
      {
        message: 'Addon created successfully',
        addon,
      },
      201
    )
  } catch (error: any) {
    return handleApiError(error, 'Create addon')
  }
}
