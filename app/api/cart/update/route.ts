import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { cookies } from "next/headers"
import { redisHelpers } from "@/lib/redis"
import { logger } from "@/lib/logger"

const updateCartSchema = z.object({
  cartItemId: z.string(),
  quantity: z.number().int().min(0).max(10),
})

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateCartSchema.parse(body)

    const cookieStore = await cookies()
    const cartId = cookieStore.get("cart_id")?.value

    if (!cartId) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }

    const cart = await redisHelpers.getCart(cartId)

    if (!cart || !cart.items) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(
      (item: any) => item.cartItemId === validatedData.cartItemId
    )

    if (itemIndex < 0) {
      return NextResponse.json({ error: "Item not found in cart" }, { status: 404 })
    }

    // Update quantity or remove if 0
    if (validatedData.quantity === 0) {
      cart.items.splice(itemIndex, 1)
    } else {
      cart.items[itemIndex].quantity = validatedData.quantity
    }

    // Clear storeSlug if cart is empty
    if (cart.items.length === 0) {
      cart.storeSlug = null
    }

    // Save updated cart
    await redisHelpers.setCart(cartId, cart, 604800)

    return NextResponse.json({
      message: "Cart updated",
      cart,
    })
  } catch (error) {
    logger.error("Update cart error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
