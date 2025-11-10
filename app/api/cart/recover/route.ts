import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { randomUUID } from "crypto"
import prisma from "@/lib/db"
import { redisHelpers } from "@/lib/redis"
import { logger } from "@/lib/logger"

/**
 * GET /api/cart/recover?token=xxxxx
 * Recover an abandoned cart using recovery token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recoveryToken = searchParams.get("token")

    if (!recoveryToken) {
      return NextResponse.json(
        { error: "Recovery token required" },
        { status: 400 }
      )
    }

    // Find abandoned cart by recovery token
    const abandonedCart = await prisma.abandoned_carts.findUnique({
      where: { recoveryToken },
      include: {
        vendor_stores: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!abandonedCart) {
      return NextResponse.json(
        { error: "Cart not found or expired" },
        { status: 404 }
      )
    }

    // Check if cart has expired
    if (new Date() > abandonedCart.expiresAt) {
      return NextResponse.json(
        { error: "Cart has expired" },
        { status: 410 }
      )
    }

    // Check if already recovered
    if (abandonedCart.isRecovered) {
      return NextResponse.json(
        { error: "Cart has already been recovered" },
        { status: 410 }
      )
    }

    // Create new cart session ID
    const newCartId = randomUUID()

    // Restore cart to Redis
    await redisHelpers.setCart(newCartId, abandonedCart.cartData, 604800) // 7 days

    // Mark cart as recovered
    await prisma.abandoned_carts.update({
      where: { id: abandonedCart.id },
      data: {
        isRecovered: true,
        recoveredAt: new Date(),
      },
    })

    // Create response and set cart cookie
    const response = NextResponse.redirect(
      new URL(`/cart?recovered=true`, request.url)
    )

    const cookieStore = await cookies()
    response.cookies.set("cart_id", newCartId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 604800, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    logger.error("Error recovering cart:", error)
    return NextResponse.json(
      { error: "Failed to recover cart" },
      { status: 500 }
    )
  }
}
