import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import redis from "@/lib/redis"
import { checkRateLimit } from "@/lib/rate-limit"
import {
  requireAuth,
  requireVendorStore,
  handleApiError,
} from "@/lib/utils/api"

const CACHE_TTL = 300 // 5 minutes in seconds

export async function GET(_request: Request) {
  try {
    const session = await requireAuth()

    // Rate limiting: 10 requests per minute per user
    const rateLimitResult = await checkRateLimit(`daily-sales:${session.user.id}`, 10, 60)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const vendorStore = await requireVendorStore(session.user.id)

    // Check Redis cache first
    const cacheKey = `daily-sales:${vendorStore.id}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return NextResponse.json(JSON.parse(cached))
    }

    // Get last 30 days of orders
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const orders = await prisma.store_orders.findMany({
      where: {
        vendorStoreId: vendorStore.id,
        paymentStatus: "PAID",
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        vendorPayout: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Group orders by date and calculate daily revenue
    const dailySalesMap = new Map<string, number>()

    // Initialize all 30 days with 0 revenue
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo)
      date.setDate(date.getDate() + i)
      const dateKey = date.toISOString().split("T")[0]
      dailySalesMap.set(dateKey, 0)
    }

    // Aggregate actual sales by date
    orders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split("T")[0]
      const currentRevenue = dailySalesMap.get(dateKey) || 0
      dailySalesMap.set(dateKey, currentRevenue + Number(order.vendorPayout))
    })

    // Convert to array format for chart
    const dailySales = Array.from(dailySalesMap.entries())
      .map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue * 100) / 100, // Round to 2 decimal places
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const responseData = { dailySales }

    // Cache the results in Redis for 5 minutes
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(responseData))

    return NextResponse.json(responseData)
  } catch (error) {
    return handleApiError(error, 'Fetch daily sales')
  }
}
