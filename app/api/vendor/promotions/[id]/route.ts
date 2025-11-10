import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

const updatePromotionSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  discountValue: z.number().positive().max(10000).optional(),
  freeShipping: z.boolean().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  conditions: z.object({
    minCartAmount: z.number().optional(),
    specificProducts: z.array(z.string()).optional(),
    specificCategories: z.array(z.string()).optional(),
  }).optional(),
})

/**
 * GET /api/vendor/promotions/[id]
 * Get a single promotion
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.vendor_stores) {
      return NextResponse.json(
        { error: "Unauthorized - Vendor access required" },
        { status: 401 }
      )
    }

    const promotion = await prisma.order_promotions.findFirst({
      where: {
        id,
        vendorStoreId: session.user.vendor_stores.id,
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

    if (!promotion) {
      return NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 }
      )
    }

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
    })
  } catch (error) {
    logger.error("Error fetching promotion:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/vendor/promotions/[id]
 * Update a promotion
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.vendor_stores) {
      return NextResponse.json(
        { error: "Unauthorized - Vendor access required" },
        { status: 401 }
      )
    }

    // Verify promotion belongs to vendor
    const existing = await prisma.order_promotions.findFirst({
      where: {
        id,
        vendorStoreId: session.user.vendor_stores.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updatePromotionSchema.parse(body)

    // Update promotion
    const promotion = await prisma.order_promotions.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
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
      message: "Promotion updated successfully",
    })
  } catch (error) {
    logger.error("Error updating promotion:", error)

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

/**
 * DELETE /api/vendor/promotions/[id]
 * Delete a promotion
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.vendor_stores) {
      return NextResponse.json(
        { error: "Unauthorized - Vendor access required" },
        { status: 401 }
      )
    }

    // Verify promotion belongs to vendor
    const existing = await prisma.order_promotions.findFirst({
      where: {
        id,
        vendorStoreId: session.user.vendor_stores.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 }
      )
    }

    await prisma.order_promotions.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "Promotion deleted successfully",
    })
  } catch (error) {
    logger.error("Error deleting promotion:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
