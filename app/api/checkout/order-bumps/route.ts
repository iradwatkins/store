import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

const fetchOrderBumpsSchema = z.object({
  storeSlug: z.string(),
  cartItems: z.array(
    z.object({
      productId: z.string(),
      price: z.number(),
      quantity: z.number(),
    })
  ),
  cartTotal: z.number(),
})

/**
 * POST /api/checkout/order-bumps
 * Fetch eligible order bumps for checkout
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = fetchOrderBumpsSchema.parse(body)

    // Get vendor store
    const store = await prisma.vendor_stores.findUnique({
      where: { slug: validatedData.storeSlug },
      select: { id: true },
    })

    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      )
    }

    // Get active order bumps for this store
    const orderBumps = await prisma.order_promotions.findMany({
      where: {
        vendorStoreId: store.id,
        type: "ORDER_BUMP",
        status: "ACTIVE",
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            price: true,
            compareAtPrice: true,
            product_images: {
              take: 1,
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
        },
      },
      orderBy: {
        priority: "desc",
      },
    })

    // Filter bumps based on conditions
    const eligibleBumps = orderBumps.filter((bump) => {
      // Check if bump product is already in cart
      const isInCart = validatedData.cartItems.some(
        (item) => item.productId === bump.productId
      )
      if (isInCart) return false

      // Check min cart amount condition
      if (bump.conditions && typeof bump.conditions === "object") {
        const conditions = bump.conditions as any
        if (conditions.minCartAmount && validatedData.cartTotal < conditions.minCartAmount) {
          return false
        }

        // Check if specific products are in cart
        if (conditions.specificProducts && Array.isArray(conditions.specificProducts)) {
          const hasRequiredProduct = validatedData.cartItems.some((item) =>
            conditions.specificProducts.includes(item.productId)
          )
          if (!hasRequiredProduct) return false
        }
      }

      return true
    })

    // Take top 3 bumps only
    const topBumps = eligibleBumps.slice(0, 3)

    // Update display count
    if (topBumps.length > 0) {
      await prisma.order_promotions.updateMany({
        where: {
          id: { in: topBumps.map((b) => b.id) },
        },
        data: {
          displayCount: {
            increment: 1,
          },
        },
      })
    }

    // Format response
    const formattedBumps = topBumps.map((bump) => {
      const product = bump.products
      const bumpPrice = product.price.toNumber()

      let finalPrice = bumpPrice
      if (bump.discountType === "PERCENTAGE") {
        finalPrice = bumpPrice * (1 - bump.discountValue.toNumber() / 100)
      } else if (bump.discountType === "FIXED") {
        finalPrice = Math.max(0, bumpPrice - bump.discountValue.toNumber())
      }

      return {
        id: bump.id,
        title: bump.title,
        description: bump.description,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          originalPrice: bumpPrice,
          finalPrice: finalPrice,
          compareAtPrice: product.compareAtPrice?.toNumber() || null,
          image: product.product_images[0]?.url || null,
        },
        discountType: bump.discountType,
        discountValue: bump.discountValue.toNumber(),
        freeShipping: bump.freeShipping,
        savings: bumpPrice - finalPrice,
      }
    })

    return NextResponse.json({
      orderBumps: formattedBumps,
    })
  } catch (error) {
    logger.error("Error fetching order bumps:", error)

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
