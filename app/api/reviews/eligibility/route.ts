import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

// GET /api/reviews/eligibility?orderItemId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderItemId = searchParams.get("orderItemId")

    if (!orderItemId) {
      return NextResponse.json(
        { error: "orderItemId is required" },
        { status: 400 }
      )
    }

    // Fetch order item with all necessary relations
    const orderItem = await prisma.store_ordersItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: true,
        product: {
          include: {
            vendor_stores: true,
          },
        },
        review: true,
      },
    })

    if (!orderItem) {
      return NextResponse.json(
        {
          eligible: false,
          reason: "Order item not found"
        },
        { status: 404 }
      )
    }

    // Check if customer owns this order
    if (orderItem.order.customerId !== session.user.id) {
      return NextResponse.json(
        {
          eligible: false,
          reason: "This order does not belong to you"
        },
        { status: 403 }
      )
    }

    // Check if already reviewed
    if (orderItem.review) {
      return NextResponse.json({
        eligible: false,
        reason: "You have already reviewed this product",
        hasReview: true,
        reviewId: orderItem.review.id,
      })
    }

    // Check payment status
    if (orderItem.order.paymentStatus !== "PAID") {
      return NextResponse.json({
        eligible: false,
        reason: "Order must be paid before reviewing",
      })
    }

    // Check if refunded
    if (orderItem.order.refundedAt) {
      return NextResponse.json({
        eligible: false,
        reason: "Cannot review refunded orders",
      })
    }

    // Check if shipped
    if (!orderItem.order.shippedAt) {
      return NextResponse.json({
        eligible: false,
        reason: "Product must be shipped before you can review it",
        waitingForShipment: true,
      })
    }

    // Check if shipped at least 3 days ago
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    if (orderItem.order.shippedAt > threeDaysAgo) {
      const daysRemaining = Math.ceil(
        (orderItem.order.shippedAt.getTime() - threeDaysAgo.getTime()) /
        (1000 * 60 * 60 * 24)
      )
      return NextResponse.json({
        eligible: false,
        reason: `Please wait ${daysRemaining} more day(s) after shipment to review`,
        waitingPeriod: true,
        daysRemaining,
      })
    }

    // Check if not too old (100 days)
    const hundredDaysAgo = new Date()
    hundredDaysAgo.setDate(hundredDaysAgo.getDate() - 100)

    if (orderItem.order.shippedAt < hundredDaysAgo) {
      return NextResponse.json({
        eligible: false,
        reason: "Review period has expired (100 days after shipment)",
        expired: true,
      })
    }

    // All checks passed - eligible to review!
    return NextResponse.json({
      eligible: true,
      orderItem: {
        id: orderItem.id,
        productId: orderItem.productId,
        productName: orderItem.name,
        variantName: orderItem.variantName,
        imageUrl: orderItem.imageUrl,
      },
      product: {
        id: orderItem.product.id,
        name: orderItem.product.name,
        slug: orderItem.product.slug,
      },
      vendor_stores: {
        id: orderItem.product.vendor_stores.id,
        name: orderItem.product.vendor_stores.name,
        slug: orderItem.product.vendor_stores.slug,
      },
    })
  } catch (error) {
    logger.error("Error checking review eligibility:", error)
    return NextResponse.json(
      { error: "Failed to check eligibility" },
      { status: 500 }
    )
  }
}
