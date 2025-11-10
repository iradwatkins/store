import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import redis from "@/lib/redis"
import { logger } from "@/lib/logger"
import { generateRecoveryCode } from "@/lib/discount-codes"

const trackAbandonedSchema = z.object({
  cartSessionId: z.string().min(1),
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
})

/**
 * POST /api/cart/track-abandoned
 * Track abandoned cart for recovery
 * Called when user provides email but doesn't complete checkout
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = trackAbandonedSchema.parse(body)

    // Get cart from Redis
    const cartData = await redis.get(`cart:${validatedData.cartSessionId}`)
    if (!cartData) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }

    const cart = JSON.parse(cartData as string)

    if (!cart.items || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    // Calculate cart total
    const cartTotal = cart.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    )

    // Get vendor store ID from storeSlug
    const storeSlug = cart.storeSlug || cart.items[0]?.storeSlug

    if (!storeSlug) {
      return NextResponse.json({ error: "Invalid cart data" }, { status: 400 })
    }

    // Look up vendor store ID from slug
    const store = await prisma.vendor_stores.findUnique({
      where: { slug: storeSlug },
      select: { id: true },
    })

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    const vendorStoreId = store.id

    // Set expiration to 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Check if abandoned cart already exists
    const existingCart = await prisma.abandoned_carts.findUnique({
      where: { cartSessionId: validatedData.cartSessionId },
    })

    if (existingCart) {
      // Update existing abandoned cart
      await prisma.abandoned_carts.update({
        where: { id: existingCart.id },
        data: {
          customerEmail: validatedData.customerEmail,
          customerName: validatedData.customerName,
          cartData: cart,
          cartTotal,
          itemCount: cart.items.length,
          updatedAt: new Date(),
        },
      })
    } else {
      // Generate unique discount code for recovery
      const discountCode = generateRecoveryCode()

      // Create new abandoned cart record with discount code
      await prisma.abandoned_carts.create({
        data: {
          cartSessionId: validatedData.cartSessionId,
          vendorStoreId,
          customerEmail: validatedData.customerEmail,
          customerName: validatedData.customerName,
          cartData: cart,
          cartTotal,
          itemCount: cart.items.length,
          expiresAt,
          discountCode,
          discountPercent: 10, // 10% off for recovery
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "Cart tracked for recovery",
    })
  } catch (error) {
    logger.error("Error tracking abandoned cart:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to track abandoned cart" },
      { status: 500 }
    )
  }
}
