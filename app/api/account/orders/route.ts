import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get orders where the customer ID or email matches the session user
    const orders = await prisma.storeOrder.findMany({
      where: {
        OR: [
          { customerId: session.user.id },
          { customerEmail: session.user.email as string },
        ],
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        vendorStore: {
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
      itemCount: order.items.length,
      vendorStore: order.vendorStore,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        imageUrl: item.imageUrl,
        product: item.product,
      })),
    }))

    return NextResponse.json({
      orders: orderSummaries,
    })
  } catch (error) {
    console.error("Error fetching customer orders:", error)
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}
