import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET(_request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get orders where the customer ID or email matches the session user
    const orders = await prisma.store_orders.findMany({
      where: {
        OR: [
          { customerId: session.user.id },
          { customerEmail: session.user.email as string },
        ],
      },
      include: {
        store_order_items: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        vendor_stores: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Transform orders for frontend
    const orderSummaries = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      itemCount: order.store_order_items.length,
      vendor_stores: order.vendor_stores,
      items: order.store_order_items.map((item) => ({
        id: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        imageUrl: item.imageUrl,
        product: item.products,
      })),
    }))

    return NextResponse.json({
      orders: orderSummaries,
    })
  } catch (error) {
    logger.error("Error fetching customer orders:", error)
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}
