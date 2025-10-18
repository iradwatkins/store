import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"


export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Fetch order
    const order = await prisma.storeOrder.findUnique({
      where: {
        id: params.id,
      },
      include: {
        items: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Verify order belongs to this vendor
    if (order.vendorStoreId !== vendorStore.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Format order for response
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        variantName: item.variantName,
        price: Number(item.price),
        quantity: item.quantity,
        imageUrl: item.imageUrl,
      })),
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      taxAmount: Number(order.taxAmount),
      total: Number(order.total),
      platformFee: Number(order.platformFee),
      vendorPayout: Number(order.vendorPayout),
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      shippingMethod: order.shippingMethod,
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      shippedAt: order.shippedAt?.toISOString() || null,
      deliveredAt: order.deliveredAt?.toISOString() || null,
      paidAt: order.paidAt?.toISOString() || null,
    }

    return NextResponse.json({ order: formattedOrder })
  } catch (error) {
    logger.error("Error fetching order:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch order",
      },
      { status: 500 }
    )
  }
}
