import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { z } from "zod"
import { redis } from "@/lib/redis"
import { getClientIp } from "@/lib/utils/ip"
import { logger } from "@/lib/logger"

const voteSchema = z.object({
  type: z.enum(["helpful", "unhelpful"]),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const body = await request.json()
    const { type } = voteSchema.parse(body)

    // Get user identifier (IP + User-Agent fingerprint)
    const ip = getClientIp(request)
    const userAgent = request.headers.get("user-agent") || "unknown"
    const voterId = `${ip}-${Buffer.from(userAgent).toString("base64").substring(0, 10)}`

    // Redis key to track votes
    const voteKey = `review:vote:${params.reviewId}:${voterId}`

    // Check if user already voted
    const existingVote = await redis.get(voteKey)

    if (existingVote) {
      // User already voted
      if (existingVote === type) {
        return NextResponse.json(
          { error: "You have already voted on this review" },
          { status: 409 }
        )
      } else {
        // User is changing their vote - decrement old, increment new
        const review = await prisma.productReview.findUnique({
          where: { id: params.reviewId },
        })

        if (!review) {
          return NextResponse.json({ error: "Review not found" }, { status: 404 })
        }

        // Atomic vote change
        const updatedReview = await prisma.productReview.update({
          where: { id: params.reviewId },
          data: {
            helpfulCount:
              type === "helpful"
                ? { increment: 1 }
                : { decrement: Math.max(0, 1) },
            unhelpfulCount:
              type === "unhelpful"
                ? { increment: 1 }
                : { decrement: Math.max(0, 1) },
          },
          select: {
            id: true,
            helpfulCount: true,
            unhelpfulCount: true,
          },
        })

        // Update vote in Redis (30 days expiry)
        await redis.setex(voteKey, 30 * 24 * 60 * 60, type)

        return NextResponse.json({
          success: true,
          voteChanged: true,
          helpfulCount: updatedReview.helpfulCount,
          unhelpfulCount: updatedReview.unhelpfulCount,
        })
      }
    }

    // New vote - find the review
    const review = await prisma.productReview.findUnique({
      where: { id: params.reviewId },
    })

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Update vote count
    const updatedReview = await prisma.productReview.update({
      where: { id: params.reviewId },
      data:
        type === "helpful"
          ? { helpfulCount: { increment: 1 } }
          : { unhelpfulCount: { increment: 1 } },
      select: {
        id: true,
        helpfulCount: true,
        unhelpfulCount: true,
      },
    })

    // Store vote in Redis (30 days expiry)
    await redis.setex(voteKey, 30 * 24 * 60 * 60, type)

    return NextResponse.json({
      success: true,
      voteChanged: false,
      helpfulCount: updatedReview.helpfulCount,
      unhelpfulCount: updatedReview.unhelpfulCount,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid vote type", details: error.issues },
        { status: 400 }
      )
    }

    logger.error("Vote error:", error)
    return NextResponse.json(
      {
        error: "Failed to record vote",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check if user has already voted
export async function GET(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    // Get user identifier
    const ip = getClientIp(request)
    const userAgent = request.headers.get("user-agent") || "unknown"
    const voterId = `${ip}-${Buffer.from(userAgent).toString("base64").substring(0, 10)}`

    // Check Redis for existing vote
    const voteKey = `review:vote:${params.reviewId}:${voterId}`
    const existingVote = await redis.get(voteKey)

    return NextResponse.json({
      hasVoted: !!existingVote,
      voteType: existingVote || null,
    })
  } catch (error) {
    logger.error("Error checking vote:", error)
    return NextResponse.json(
      { hasVoted: false, voteType: null },
      { status: 200 }
    )
  }
}
