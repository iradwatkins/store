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
    const rateLimitResult = await checkRateLimit(`analytics:${session.user.id}`, 10, 60)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const vendorStore = await requireVendorStore(session.user.id)

    // Check Redis cache first
    const cacheKey = `analytics:${vendorStore.id}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return NextResponse.json(JSON.parse(cached))
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Parallel queries for better performance
    const [
      sales30d,
      sales90d,
      salesAllTime,
      orders30d,
      orders90d,
      ordersAllTime,
      activeProducts,
      lowStockProducts,
      topProducts,
    ] = await Promise.all([
      // 30-day sales
      prisma.store_orders.aggregate({
        where: {
          vendorStoreId: vendorStore.id,
          paymentStatus: "PAID",
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { vendorPayout: true },
      }),

      // 90-day sales
      prisma.store_orders.aggregate({
        where: {
          vendorStoreId: vendorStore.id,
          paymentStatus: "PAID",
          createdAt: { gte: ninetyDaysAgo },
        },
        _sum: { vendorPayout: true },
      }),

      // All-time sales
      prisma.store_orders.aggregate({
        where: {
          vendorStoreId: vendorStore.id,
          paymentStatus: "PAID",
        },
        _sum: { vendorPayout: true },
      }),

      // 30-day orders count
      prisma.store_orders.count({
        where: {
          vendorStoreId: vendorStore.id,
          paymentStatus: "PAID",
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      // 90-day orders count
      prisma.store_orders.count({
        where: {
          vendorStoreId: vendorStore.id,
          paymentStatus: "PAID",
          createdAt: { gte: ninetyDaysAgo },
        },
      }),

      // All-time orders count
      prisma.store_orders.count({
        where: {
          vendorStoreId: vendorStore.id,
          paymentStatus: "PAID",
        },
      }),

      // Active products count
      prisma.products.count({
        where: {
          vendorStoreId: vendorStore.id,
          status: "ACTIVE",
        },
      }),

      // Low stock products count (quantity < 5)
      prisma.products.count({
        where: {
          vendorStoreId: vendorStore.id,
          status: "ACTIVE",
          quantity: { lt: 5, gt: 0 },
        },
      }),

      // Top 5 products by sales revenue
      prisma.products.findMany({
        where: {
          vendorStoreId: vendorStore.id,
          salesCount: { gt: 0 },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          salesCount: true,
        },
        orderBy: {
          salesCount: "desc",
        },
        take: 5,
      }),
    ])

    // Calculate revenue for top products (price × salesCount)
    const topProductsWithRevenue = topProducts.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      salesCount: product.salesCount,
      revenue: Number(product.price) * product.salesCount,
    }))

    // Sort by revenue (in case same salesCount but different prices)
    topProductsWithRevenue.sort((a, b) => b.revenue - a.revenue)

    const analyticsData = {
      sales: {
        thirtyDays: Number(sales30d._sum.vendorPayout) || 0,
        ninetyDays: Number(sales90d._sum.vendorPayout) || 0,
        allTime: Number(salesAllTime._sum.vendorPayout) || 0,
      },
      orders: {
        thirtyDays: orders30d,
        ninetyDays: orders90d,
        allTime: ordersAllTime,
      },
      products: {
        active: activeProducts,
        lowStock: lowStockProducts,
      },
      topProducts: topProductsWithRevenue,
    }

    // Cache the results in Redis for 5 minutes
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(analyticsData))

    return NextResponse.json(analyticsData)
  } catch (error) {
    return handleApiError(error, 'Fetch analytics')
  }
}
