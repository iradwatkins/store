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

const createVariantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  value: z.string().min(1, "Variant value is required"),
  price: z.number().optional().nullable(),
  sku: z.string().optional().nullable(),
  quantity: z.number().int().min(0, "Quantity must be non-negative"),
  available: z.boolean().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const isAdmin = session.user.role === "ADMIN"

    // Verify product ownership
    let product
    if (isAdmin) {
      product = await prisma.products.findUnique({
        where: { id: params.id },
        include: { product_variants: true },
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
        include: { product_variants: true },
      })
    }

    if (!product) {
      throw new BusinessLogicError("Product not found")
    }

    const body = await request.json()
    const validatedData = createVariantSchema.parse(body)

    // Get max sortOrder
    const maxSortOrder = product.variants.length > 0
      ? Math.max(...product.variants.map((v: any) => v.sortOrder))
      : -1

    // Create variant
    const variant = await prisma.product_variants.create({
      data: {
        productId: product.id,
        name: validatedData.name,
        value: validatedData.value,
        price: validatedData.price,
        sku: validatedData.sku,
        quantity: validatedData.quantity,
        available: validatedData.available !== undefined ? validatedData.available : true,
        sortOrder: maxSortOrder + 1,
      },
    })

    // Update product hasVariants flag if this is the first variant
    if (product.variants.length === 0) {
      await prisma.products.update({
        where: { id: product.id },
        data: { hasVariants: true },
      })
    }

    logger.info(`${isAdmin ? 'Admin' : 'Vendor'} added variant to product: ${product.name}`)

    return successResponse(
      {
        message: "Variant created successfully",
        variant,
      },
      201
    )
  } catch (error) {
    return handleApiError(error, 'Create variant')
  }
}
