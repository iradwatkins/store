import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { cookies } from "next/headers"
import { redisHelpers } from "@/lib/redis"
import { logger } from "@/lib/logger"

const removeFromCartSchema = z.object({
  cartItemId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = removeFromCartSchema.parse(body)

    const cookieStore = await cookies()
    const cartId = cookieStore.get("cart_id")?.value

    if (!cartId) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }

    const cart = await redisHelpers.getCart(cartId)

    if (!cart || !cart.items) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }

    // Remove item from cart
    cart.items = cart.items.filter(
      (item: any) => item.cartItemId !== validatedData.cartItemId
    )

    // Clear storeSlug if cart is empty
    if (cart.items.length === 0) {
      cart.storeSlug = null
    }

    // Save updated cart
    await redisHelpers.setCart(cartId, cart, 604800)

    return NextResponse.json({
      message: "Item removed from cart",
      cart,
    })
  } catch (error) {
    logger.error("Remove from cart error:", error)

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
