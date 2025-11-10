import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const trackSchema = z.object({
  action: z.enum(["accepted"]),
  productPrice: z.number().optional(), // Price of the promoted product added to cart
})

/**
 * POST /api/vendor/promotions/[id]/track
 * Track promotion analytics (acceptance) with revenue tracking
 * Authentication optional - uses session to prevent abuse if available
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = trackSchema.parse(body)

    // Verify promotion exists and is active (basic validation)
    const promotion = await prisma.order_promotions.findUnique({
      where: { id },
      select: { status: true, productId: true },
    })

    if (!promotion || promotion.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Promotion not active" },
        { status: 400 }
      )
    }

    if (validatedData.action === "accepted") {
      // Calculate revenue added based on product price if provided
      let revenueAdded = 0
      if (validatedData.productPrice) {
        revenueAdded = validatedData.productPrice
      } else {
        // Fallback: fetch product price from database
        const product = await prisma.products.findUnique({
          where: { id: promotion.productId },
          select: { price: true },
        })
        if (product) {
          revenueAdded = product.price.toNumber()
        }
      }

      await prisma.order_promotions.update({
        where: { id },
        data: {
          acceptedCount: { increment: 1 },
          revenueAdded: { increment: revenueAdded },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Error tracking promotion:", error)
    // Silent fail for analytics - don't interrupt user flow
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
