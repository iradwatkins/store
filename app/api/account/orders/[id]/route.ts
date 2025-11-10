import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const order = await prisma.store_orders.findFirst({
      where: {
        id: params.id,
        OR: [
          { customerId: session.user.id },
          { customerEmail: session.user.email! },
        ],
      },
      include: {
        store_order_items: {
          include: {
            products: {
              select: {
                slug: true,
                product_images: {
                  take: 1,
                  select: {
                    url: true,
                    medium: true,
                  },
                },
              },
            },
          },
        },
        vendor_stores: {
          select: {
            name: true,
            slug: true,
            email: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Format the response
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      taxAmount: Number(order.taxAmount),
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      shippingMethod: order.shippingMethod,
      shippedAt: order.shippedAt?.toISOString() || null,
      deliveredAt: order.deliveredAt?.toISOString() || null,
      cancelledAt: order.cancelledAt?.toISOString() || null,
      cancelReason: order.cancelReason,
      items: order.store_order_items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        imageUrl:
          item.products?.product_images[0]?.medium ||
          item.products?.product_images[0]?.url ||
          null,
        variantName: item.variantId ? item.sku : null,
      })),
      vendor_stores: order.vendor_stores,
    }

    return NextResponse.json({ order: formattedOrder })
  } catch (error) {
    logger.error("Error fetching order:", error)
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    )
  }
}
