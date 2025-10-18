import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

// Validation schema
const respondSchema = z.object({
  response: z.string().min(10).max(500),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reviewId } = params
    const body = await request.json()

    // Validate input
    const validatedData = respondSchema.parse(body)

    // Get review and check ownership
    const review = await prisma.productReview.findUnique({
      where: { id: reviewId },
      include: {
        vendorStore: true,
      },
    })

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Check if user owns the vendor store
    if (review.vendorStore.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only respond to reviews on your own products" },
        { status: 403 }
      )
    }

    // Check if already responded
    if (review.vendorResponse) {
      return NextResponse.json(
        { error: "You have already responded to this review" },
        { status: 400 }
      )
    }

    // Update review with vendor response
    const updatedReview = await prisma.productReview.update({
      where: { id: reviewId },
      data: {
        vendorResponse: validatedData.response,
        vendorRespondedAt: new Date(),
      },
      select: {
        id: true,
        vendorResponse: true,
        vendorRespondedAt: true,
        customerEmail: true,
        productId: true,
      },
    })

    // TODO: Send customer notification email

    return NextResponse.json({
      success: true,
      review: {
        id: updatedReview.id,
        vendorResponse: updatedReview.vendorResponse,
        vendorRespondedAt: updatedReview.vendorRespondedAt,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    logger.error("Error responding to review:", error)
    return NextResponse.json(
      { error: "Failed to respond to review" },
      { status: 500 }
    )
  }
}
