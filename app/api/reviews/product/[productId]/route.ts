import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Sort options
    const sortBy = searchParams.get("sort") || "recent"
    let orderBy: any = { createdAt: "desc" } // Default: most recent

    if (sortBy === "highest") {
      orderBy = { rating: "desc" }
    } else if (sortBy === "lowest") {
      orderBy = { rating: "asc" }
    } else if (sortBy === "helpful") {
      orderBy = { helpfulCount: "desc" }
    }

    // Fetch reviews
    const [reviews, totalCount] = await Promise.all([
      prisma.product_reviews.findMany({
        where: {
          productId,
          status: "PUBLISHED",
        },
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          rating: true,
          title: true,
          review: true,
          photoUrls: true,
          customerName: true,
          isVerifiedPurchase: true,
          vendorResponse: true,
          vendorRespondedAt: true,
          helpfulCount: true,
          unhelpfulCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.product_reviews.count({
        where: {
          productId,
          status: "PUBLISHED",
        },
      }),
    ])

    // Get product aggregates
    const product = await prisma.products.findUnique({
      where: { id: productId },
      select: {
        averageRating: true,
        reviewCount: true,
      },
    })

    // Get rating distribution
    const ratingDistribution = await prisma.product_reviews.groupBy({
      by: ["rating"],
      where: {
        productId,
        status: "PUBLISHED",
      },
      _count: {
        rating: true,
      },
    })

    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    }

    ratingDistribution.forEach((item) => {
      distribution[item.rating as keyof typeof distribution] = item._count.rating
    })

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + reviews.length < totalCount,
      },
      aggregates: {
        averageRating: product?.averageRating
          ? Number(product.averageRating)
          : null,
        totalReviews: product?.reviewCount || 0,
        distribution,
      },
    })
  } catch (error) {
    logger.error("Error fetching reviews:", error)
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}
