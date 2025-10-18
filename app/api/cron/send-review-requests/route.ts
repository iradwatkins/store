import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { sendReviewRequest } from "@/lib/email"
import { generateReviewToken, getReviewUrl } from "@/lib/review-token"

/**
 * Cron job to send review request emails
 * Runs daily to check for orders shipped 3 days ago
 *
 * Set up in your cron service (e.g., Vercel Cron, GitHub Actions, or cron-job.org):
 * Schedule: "0 10 * * *" (10 AM UTC daily)
 * URL: POST /api/cron/send-review-requests
 * Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error("CRON_SECRET not configured")
      return NextResponse.json(
        { error: "Cron job not configured" },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Calculate date range: exactly 3 days ago
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    threeDaysAgo.setHours(0, 0, 0, 0) // Start of day

    const threeDaysAgoEnd = new Date(threeDaysAgo)
    threeDaysAgoEnd.setHours(23, 59, 59, 999) // End of day

    console.log(
      `Checking for orders shipped between ${threeDaysAgo.toISOString()} and ${threeDaysAgoEnd.toISOString()}`
    )

    // Find all orders shipped exactly 3 days ago that are paid and delivered/shipped
    const eligibleOrders = await prisma.storeOrder.findMany({
      where: {
        shippedAt: {
          gte: threeDaysAgo,
          lte: threeDaysAgoEnd,
        },
        paymentStatus: "PAID",
        status: {
          in: ["PAID"], // Only paid orders
        },
        fulfillmentStatus: {
          in: ["SHIPPED", "DELIVERED"], // Must be shipped or delivered
        },
        refundedAt: null, // Not refunded
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { sortOrder: "asc" },
                  take: 1,
                },
                vendorStore: true,
              },
            },
            review: true, // Check if already reviewed
          },
        },
      },
    })

    console.log(`Found ${eligibleOrders.length} eligible orders`)

    let emailsSent = 0
    let emailsFailed = 0
    const errors: string[] = []

    // Process each order item
    for (const order of eligibleOrders) {
      for (const item of order.items) {
        // Skip if already reviewed
        if (item.review) {
          console.log(
            `Skipping order item ${item.id} - already has review ${item.review.id}`
          )
          continue
        }

        try {
          // Generate review token
          const token = generateReviewToken(item.id)
          const reviewUrl = getReviewUrl(token)

          // Get product image URL
          const productImageUrl =
            item.product.images[0]?.url || item.imageUrl || undefined

          // Send review request email
          await sendReviewRequest({
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            productName: item.name,
            productImageUrl,
            orderNumber: order.orderNumber,
            storeName: item.product.vendorStore.name,
            reviewUrl,
          })

          emailsSent++
          console.log(
            `✅ Review request sent for order item ${item.id} (${item.name})`
          )
        } catch (error) {
          emailsFailed++
          const errorMsg = `Failed to send review request for order item ${item.id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
          console.error(errorMsg)
          errors.push(errorMsg)
        }
      }
    }

    // Summary
    const summary = {
      success: true,
      ordersChecked: eligibleOrders.length,
      totalItems: eligibleOrders.reduce(
        (sum, order) => sum + order.items.length,
        0
      ),
      emailsSent,
      emailsFailed,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    }

    console.log("Cron job completed:", JSON.stringify(summary, null, 2))

    return NextResponse.json(summary)
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process review requests",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Allow GET for testing (only in development)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "GET method only available in development" },
      { status: 403 }
    )
  }

  // In development, allow GET without auth for testing
  return POST(request)
}
