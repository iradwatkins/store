import { NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * Monthly Usage Reset Cron Job
 *
 * Resets monthly usage counters for all tenants on the 1st of each month
 *
 * Schedule: 0 0 1 * * (midnight on 1st of month)
 *
 * Setup Instructions:
 * 1. Configure cron service (cron-job.org, GitHub Actions, or similar)
 * 2. Set URL: https://stores.stepperslife.com/api/cron/reset-monthly-usage
 * 3. Add header: Authorization: Bearer <CRON_SECRET>
 * 4. Schedule: 0 0 1 * * (every 1st of month at midnight)
 */

export async function GET(request: Request) {
  try {
    // 1. Verify cron secret for security
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token || token !== process.env.CRON_SECRET) {
      console.error("Unauthorized cron request: Invalid or missing token")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("Starting monthly usage reset...")

    // 2. Get current date for logging
    const now = new Date()
    const month = now.toLocaleDateString("en-US", { month: "long", year: "numeric" })

    // 3. Reset monthly order counts for all tenants
    const result = await prisma.tenant.updateMany({
      data: {
        currentOrders: 0,
      },
    })

    console.log(`Monthly usage reset complete: ${result.count} tenants updated for ${month}`)

    // 4. Optionally: Create usage records for historical tracking
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        currentOrders: true,
        currentProducts: true,
        currentStorageGB: true,
      },
    })

    // Log reset summary (optional)
    console.log("Reset Summary:", {
      month,
      tenantsReset: result.count,
      timestamp: now.toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: `Monthly usage reset complete for ${month}`,
      tenantsUpdated: result.count,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error("Error resetting monthly usage:", error)
    return NextResponse.json(
      {
        error: "Failed to reset monthly usage",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Also support POST for some cron services
export async function POST(request: Request) {
  return GET(request)
}
