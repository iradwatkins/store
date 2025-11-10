import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

// Validation schema
const flagSchema = z.object({
  reason: z.enum([
    "spam",
    "offensive",
    "off-topic",
    "personal-info",
    "external-links",
    "other",
  ]),
  details: z.string().max(500).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const { reviewId } = params
    const body = await request.json()

    // Validate input
    const validatedData = flagSchema.parse(body)

    // Get review
    const review = await prisma.product_reviews.findUnique({
      where: { id: reviewId },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Check if already flagged
    if (review.status === "FLAGGED") {
      return NextResponse.json(
        { error: "This review has already been flagged" },
        { status: 400 }
      )
    }

    // Map reason to user-friendly text
    const reasonText = {
      spam: "Spam or fake review",
      offensive: "Offensive language",
      "off-topic": "Off-topic content",
      "personal-info": "Contains personal information",
      "external-links": "Contains external links",
      other: "Other reason",
    }[validatedData.reason]

    const flagReason = validatedData.details
      ? `${reasonText}: ${validatedData.details}`
      : reasonText

    // Update review status to FLAGGED
    await prisma.product_reviews.update({
      where: { id: reviewId },
      data: {
        status: "FLAGGED",
        flaggedAt: new Date(),
        flagReason,
      },
    })

    // TODO: Send admin notification email
    // TODO: Log flag action in audit log

    return NextResponse.json({
      success: true,
      message: "Review flagged for moderation",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    logger.error("Error flagging review:", error)
    return NextResponse.json(
      { error: "Failed to flag review" },
      { status: 500 }
    )
  }
}
