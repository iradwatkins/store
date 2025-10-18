import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

// Validation schema
const createReviewSchema = z.object({
  orderItemId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(10).max(100).optional(),
  review: z.string().min(50).max(5000),
  photoUrls: z.array(z.string()).max(3).optional(),
  customerName: z.string().min(1),
  customerEmail: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = createReviewSchema.parse(body)

    // Check if order item exists and is eligible for review
    const orderItem = await prisma.storeOrderItem.findUnique({
      where: { id: validatedData.orderItemId },
      include: {
        order: true,
        product: {
          include: {
            vendorStore: true,
          },
        },
        review: true, // Check if already reviewed
      },
    })

    if (!orderItem) {
      return NextResponse.json(
        { error: "Order item not found" },
        { status: 404 }
      )
    }

    // Check if already reviewed
    if (orderItem.review) {
      return NextResponse.json(
        { error: "This product has already been reviewed" },
        { status: 400 }
      )
    }

    // Check eligibility: Order must be shipped at least 3 days ago
    const order = orderItem.order
    if (!order.shippedAt) {
      return NextResponse.json(
        { error: "Order must be shipped before reviewing" },
        { status: 400 }
      )
    }

    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    if (order.shippedAt > threeDaysAgo) {
      return NextResponse.json(
        { error: "Please wait 3 days after shipment to leave a review" },
        { status: 400 }
      )
    }

    // Check if not too old (100 days)
    const hundredDaysAgo = new Date()
    hundredDaysAgo.setDate(hundredDaysAgo.getDate() - 100)
    if (order.shippedAt < hundredDaysAgo) {
      return NextResponse.json(
        { error: "Review period has expired (100 days)" },
        { status: 400 }
      )
    }

    // Check if paid and not refunded
    if (order.paymentStatus !== "PAID") {
      return NextResponse.json(
        { error: "Order must be paid to leave a review" },
        { status: 400 }
      )
    }

    if (order.refundedAt) {
      return NextResponse.json(
        { error: "Cannot review refunded orders" },
        { status: 400 }
      )
    }

    // Create the review
    const review = await prisma.productReview.create({
      data: {
        productId: orderItem.productId,
        orderItemId: validatedData.orderItemId,
        vendorStoreId: orderItem.product.vendorStoreId,
        customerId: order.customerId,
        rating: validatedData.rating,
        title: validatedData.title || null,
        review: validatedData.review,
        photoUrls: validatedData.photoUrls || [],
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail,
        isVerifiedPurchase: true,
        status: "PUBLISHED",
      },
    })

    // Update product aggregates
    await updateProductAggregates(orderItem.productId)

    // Update shop aggregates
    await updateShopAggregates(orderItem.product.vendorStoreId)

    // TODO: Send vendor notification email

    return NextResponse.json(
      {
        success: true,
        review: {
          id: review.id,
          rating: review.rating,
          createdAt: review.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    logger.error("Error creating review:", error)
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    )
  }
}

// Helper: Update product average rating and review count
async function updateProductAggregates(productId: string) {
  const aggregates = await prisma.productReview.aggregate({
    where: {
      productId,
      status: "PUBLISHED",
    },
    _avg: {
      rating: true,
    },
    _count: {
      id: true,
    },
  })

  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: aggregates._avg.rating || null,
      reviewCount: aggregates._count.id,
    },
  })
}

// Helper: Update shop rating aggregates
async function updateShopAggregates(vendorStoreId: string) {
  const aggregates = await prisma.productReview.aggregate({
    where: {
      vendorStoreId,
      status: "PUBLISHED",
    },
    _avg: {
      rating: true,
    },
    _count: {
      id: true,
    },
  })

  const ratingDistribution = await prisma.productReview.groupBy({
    by: ["rating"],
    where: {
      vendorStoreId,
      status: "PUBLISHED",
    },
    _count: {
      rating: true,
    },
  })

  const distribution = {
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStar: 0,
  }

  ratingDistribution.forEach((item) => {
    if (item.rating === 5) distribution.fiveStars = item._count.rating
    if (item.rating === 4) distribution.fourStars = item._count.rating
    if (item.rating === 3) distribution.threeStars = item._count.rating
    if (item.rating === 2) distribution.twoStars = item._count.rating
    if (item.rating === 1) distribution.oneStar = item._count.rating
  })

  // Upsert ShopRating
  await prisma.shopRating.upsert({
    where: { vendorStoreId },
    create: {
      vendorStoreId,
      averageRating: aggregates._avg.rating || 0,
      totalReviews: aggregates._count.id,
      ...distribution,
    },
    update: {
      averageRating: aggregates._avg.rating || 0,
      totalReviews: aggregates._count.id,
      ...distribution,
      lastCalculated: new Date(),
    },
  })

  // Update VendorStore aggregates
  await prisma.vendorStore.update({
    where: { id: vendorStoreId },
    data: {
      averageRating: aggregates._avg.rating || null,
      totalReviews: aggregates._count.id,
    },
  })
}
