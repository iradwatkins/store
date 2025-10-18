import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { validateAndCalculateCoupon } from "@/lib/coupon"
import prisma from "@/lib/db"
import { z } from "zod"

const applyCouponSchema = z.object({
  couponCode: z.string().min(1, "Coupon code is required"),
  vendorStoreId: z.string().min(1, "Vendor store ID is required"),
  cartItems: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().optional(),
      price: z.number().positive(),
      quantity: z.number().int().positive(),
    })
  ),
  subtotal: z.number().positive(),
  shippingCost: z.number().nonnegative(),
})

/**
 * POST /api/cart/apply-coupon
 * Validate and apply a coupon code to the cart
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Parse and validate request body
    const body = await request.json()
    const validatedData = applyCouponSchema.parse(body)

    // Get product categories for items
    const productIds = validatedData.cartItems.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, category: true },
    })

    // Map categories to cart items
    const cartItemsWithCategories = validatedData.cartItems.map((item) => ({
      ...item,
      category: products.find((p) => p.id === item.productId)?.category,
    }))

    // Validate and calculate coupon
    const result = await validateAndCalculateCoupon({
      couponCode: validatedData.couponCode,
      vendorStoreId: validatedData.vendorStoreId,
      cartItems: cartItemsWithCategories,
      subtotal: validatedData.subtotal,
      shippingCost: validatedData.shippingCost,
      customerId: session?.user?.id,
      customerEmail: session?.user?.email || undefined,
    })

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      discountAmount: result.discountAmount,
      coupon: result.coupon,
      message: `Coupon applied! You saved $${result.discountAmount?.toFixed(2)}`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error applying coupon:", error)
    return NextResponse.json(
      { error: "Failed to apply coupon" },
      { status: 500 }
    )
  }
}
