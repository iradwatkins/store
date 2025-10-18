import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"


export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get vendor store for this user
    const vendorStore = await prisma.vendorStore.findFirst({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    })

    if (!vendorStore) {
      return NextResponse.json({ error: "Vendor store not found" }, { status: 404 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "all"
    const dateRange = searchParams.get("dateRange") || "30days"
    const sortBy = searchParams.get("sortBy") || "date_desc"

    // Build date filter
    let dateFilter = {}
    const now = new Date()
    if (dateRange === "7days") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      dateFilter = { gte: sevenDaysAgo }
    } else if (dateRange === "30days") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      dateFilter = { gte: thirtyDaysAgo }
    } else if (dateRange === "90days") {
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      dateFilter = { gte: ninetyDaysAgo }
    }

    // Build fulfillment status filter
    let fulfillmentFilter = {}
    if (status === "unfulfilled") {
      fulfillmentFilter = { fulfillmentStatus: "UNFULFILLED" }
    } else if (status === "shipped") {
      fulfillmentFilter = { fulfillmentStatus: "SHIPPED" }
    } else if (status === "delivered") {
      fulfillmentFilter = { fulfillmentStatus: "DELIVERED" }
    }

    // Build sort order
    let orderBy: any = { createdAt: "desc" }
    if (sortBy === "date_asc") {
      orderBy = { createdAt: "asc" }
    } else if (sortBy === "total_desc") {
      orderBy = { total: "desc" }
    } else if (sortBy === "total_asc") {
      orderBy = { total: "asc" }
    }

    // Fetch orders
    const orders = await prisma.storeOrder.findMany({
      where: {
        vendorStoreId: vendorStore.id,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        ...fulfillmentFilter,
      },
      include: {
        items: true,
      },
      orderBy,
    })

    // Format orders for response
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.productName || item.name || 'Unknown Product',
        quantity: item.quantity,
        price: Number(item.price),
        imageUrl: item.imageUrl,
      })),
      total: Number(order.total),
      status: order.status,
      fulfillmentStatus: order.fulfillmentStatus,
      paymentStatus: order.paymentStatus,
    }))

    return NextResponse.json({ orders: formattedOrders })
  } catch (error) {
    logger.error("Error fetching orders:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch orders",
      },
      { status: 500 }
    )
  }
}
