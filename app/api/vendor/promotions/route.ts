import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

const createPromotionSchema = z.object({
  type: z.enum(["ORDER_BUMP", "UPSELL", "CROSS_SELL"]),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  productId: z.string(),
  variantId: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive().max(10000),
  freeShipping: z.boolean().default(false),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  priority: z.number().int().min(0).max(100).default(0),
  conditions: z.object({
    minCartAmount: z.number().optional(),
    specificProducts: z.array(z.string()).optional(),
    specificCategories: z.array(z.string()).optional(),
  }).optional(),
})

/**
 * GET /api/vendor/promotions
 * Get all promotions for the vendor's store
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.vendor_stores) {
      return NextResponse.json(
        { error: "Unauthorized - Vendor access required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")

    const where: any = {
      vendorStoreId: session.user.vendor_stores.id,
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    const promotions = await prisma.order_promotions.findMany({
      where,
      include: {
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            product_images: {
              take: 1,
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    })

    // Convert Decimal to number
    const formattedPromotions = promotions.map((promo) => ({
      ...promo,
      discountValue: promo.discountValue.toNumber(),
      revenueAdded: promo.revenueAdded.toNumber(),
      products: {
        ...promo.products,
        price: promo.products.price.toNumber(),
      },
    }))

    return NextResponse.json({
      promotions: formattedPromotions,
    })
  } catch (error) {
    logger.error("Error fetching promotions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/vendor/promotions
 * Create a new promotion
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.vendor_stores) {
      return NextResponse.json(
        { error: "Unauthorized - Vendor access required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createPromotionSchema.parse(body)

    // Verify product belongs to vendor
    const product = await prisma.products.findFirst({
      where: {
        id: validatedData.productId,
        vendorStoreId: session.user.vendor_stores.id,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found or does not belong to your store" },
        { status: 404 }
      )
    }

    // Create promotion
    const promotion = await prisma.order_promotions.create({
      data: {
        vendorStoreId: session.user.vendor_stores.id,
        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description,
        productId: validatedData.productId,
        variantId: validatedData.variantId,
        discountType: validatedData.discountType,
        discountValue: validatedData.discountValue,
        freeShipping: validatedData.freeShipping,
        status: validatedData.status,
        priority: validatedData.priority,
        conditions: validatedData.conditions || {},
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            product_images: {
              take: 1,
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
        },
      },
    })

    // Convert Decimal to number
    const formattedPromotion = {
      ...promotion,
      discountValue: promotion.discountValue.toNumber(),
      revenueAdded: promotion.revenueAdded.toNumber(),
      products: {
        ...promotion.products,
        price: promotion.products.price.toNumber(),
      },
    }

    return NextResponse.json({
      promotion: formattedPromotion,
      message: "Promotion created successfully",
    })
  } catch (error) {
    logger.error("Error creating promotion:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
