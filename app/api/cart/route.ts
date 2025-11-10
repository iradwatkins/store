import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { redisHelpers } from "@/lib/redis"
import { logger } from "@/lib/logger"

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const cartId = cookieStore.get("cart_id")?.value

    if (!cartId) {
      return NextResponse.json({
        cart: { items: [], storeSlug: null },
        total: 0,
        itemCount: 0,
      })
    }

    const cart = await redisHelpers.getCart(cartId)

    if (!cart || !cart.items) {
      return NextResponse.json({
        cart: { items: [], storeSlug: null },
        total: 0,
        itemCount: 0,
      })
    }

    // Calculate totals
    const total = cart.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    )

    const itemCount = cart.items.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0
    )

    return NextResponse.json({
      cart,
      total,
      itemCount,
      cartSessionId: cartId,
    })
  } catch (error) {
    logger.error("Get cart error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const cartId = cookieStore.get("cart_id")?.value

    if (!cartId) {
      return NextResponse.json({ message: "Cart cleared" })
    }

    // Clear cart in Redis
    await redisHelpers.setCart(cartId, { items: [], storeSlug: null }, 604800)

    return NextResponse.json({ message: "Cart cleared" })
  } catch (error) {
    logger.error("Clear cart error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
