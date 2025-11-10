/**
 * Variant Combinations API
 *
 * POST /api/vendor/products/[id]/variants/combinations
 * - Generate all possible variant combinations for a product
 * - Supports multi-dimensional variants (Size + Color + Material)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { logger } from "@/lib/logger"

// Validation schema for creating variant combinations
const createCombinationsSchema = z.object({
  variantTypes: z.array(z.string()).min(1).max(3), // e.g., ["SIZE", "COLOR", "MATERIAL"]
  options: z.array(
    z.object({
      type: z.string(),
      values: z.array(
        z.object({
          value: z.string(),
          displayName: z.string().optional(),
          hexColor: z.string().optional(),
          imageUrl: z.string().optional(),
          icon: z.string().optional(),
        })
      ),
    })
  ),
  generateCombinations: z.boolean().default(true),
  defaults: z
    .object({
      price: z.number().optional(),
      quantity: z.number().int().min(0).optional(),
      sku: z.string().optional(),
    })
    .optional(),
})

type CreateCombinationsInput = z.infer<typeof createCombinationsSchema>

/**
 * Generate all combinations from variant options
 */
function generateAllCombinations(
  options: CreateCombinationsInput['options']
): Array<Record<string, string>> {
  if (options.length === 0) {return []}
  if (options.length === 1) {
    return options[0].values.map((v) => ({ [options[0].type]: v.value }))
  }

  const [first, ...rest] = options
  const restCombinations = generateAllCombinations(rest)

  const combinations: Array<Record<string, string>> = []
  for (const value of first.values) {
    for (const restCombination of restCombinations) {
      combinations.push({
        [first.type]: value.value,
        ...restCombination,
      })
    }
  }

  return combinations
}

/**
 * Create combination key from option values
 */
function createCombinationKey(optionValues: Record<string, string>): string {
  return Object.entries(optionValues)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, value]) => `${type}:${value}`)
    .join('|')
}

/**
 * POST - Generate variant combinations
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

    // Parse and validate request body
    const body = await req.json()
    const validatedData = createCombinationsSchema.parse(body)

    const { variantTypes, options, generateCombinations, defaults } =
      validatedData

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Create VariantOptions
      const createdOptions: Record<string, any[]> = {}

      for (const optionGroup of options) {
        const optionType = optionGroup.type
        createdOptions[optionType] = []

        for (let i = 0; i < optionGroup.values.length; i++) {
          const value = optionGroup.values[i]

          const variantOption = await tx.variantOption.create({
            data: {
              productId,
              type: optionType,
              value: value.value,
              displayName: value.displayName || value.value,
              hexColor: value.hexColor,
              imageUrl: value.imageUrl,
              icon: value.icon,
              sortOrder: i,
              isActive: true,
            },
          })

          createdOptions[optionType].push(variantOption)
        }
      }

      // Step 2: Generate combinations if requested
      const createdCombinations: any[] = []

      if (generateCombinations) {
        const allCombinations = generateAllCombinations(options)

        for (let i = 0; i < allCombinations.length; i++) {
          const optionValues = allCombinations[i]
          const combinationKey = createCombinationKey(optionValues)

          // Check if combination already exists
          const existing = await tx.variantCombination.findUnique({
            where: {
              productId_combinationKey: {
                productId,
                combinationKey,
              },
            },
          })

          if (existing) {
            continue // Skip if already exists
          }

          // Create combination
          const combination = await tx.variantCombination.create({
            data: {
              productId,
              combinationKey,
              optionValues,
              sku: defaults?.sku
                ? `${defaults.sku}-${i + 1}`
                : undefined,
              price: defaults?.price,
              quantity: defaults?.quantity ?? 0,
              inventoryTracked: true,
              available: true,
              inStock: (defaults?.quantity ?? 0) > 0,
              sortOrder: i,
            },
          })

          createdCombinations.push(combination)
        }
      }

      // Step 3: Update product to use multi-variant system
      await tx.products.update({
        where: { id: productId },
        data: {
          variantTypes,
          useMultiVariants: true,
          hasVariants: true,
        },
      })

      return {
        options: createdOptions,
        combinations: createdCombinations,
      }
    })

    // Count total options and combinations
    const totalOptions = Object.values(result.options).reduce(
      (sum, arr) => sum + arr.length,
      0
    )

    return NextResponse.json(
      {
        success: true,
        message: `Created ${totalOptions} variant options and ${result.combinations.length} combinations`,
        created: result.combinations.length,
        options: result.options,
        combinations: result.combinations,
      },
      { status: 201 }
    )
  } catch (error: any) {
    logger.error("Error creating variant combinations:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create variant combinations' },
      { status: 500 }
    )
  }
}

/**
 * GET - Fetch all variant combinations for a product
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
    const product = await prisma.products.findUnique({
      where: { id: productId },
      include: {
        vendor_stores: true,
        variantOptions: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        variantCombinations: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.vendor_stores.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Group options by type
    const groupedOptions: Record<string, any[]> = {}
    for (const option of product.variantOptions) {
      if (!groupedOptions[option.type]) {
        groupedOptions[option.type] = []
      }
      groupedOptions[option.type].push(option)
    }

    return NextResponse.json({
      success: true,
      variantTypes: product.variantTypes,
      useMultiVariants: product.useMultiVariants,
      options: groupedOptions,
      combinations: product.variantCombinations,
      totalCombinations: product.variantCombinations.length,
    })
  } catch (error: any) {
    logger.error("Error fetching variant combinations:", error)
    return NextResponse.json(
      { error: 'Failed to fetch variant combinations' },
      { status: 500 }
    )
  }
}
