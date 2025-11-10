// NextResponse import removed - unused
import prisma from "@/lib/db"
import {
  requireAuth,
  requireVendorStore,
  handleApiError,
  successResponse,
} from "@/lib/utils/api"
import { BusinessLogicError } from "@/lib/errors"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    // Fetch order
    const order = await prisma.store_orders.findUnique({
      where: {
        id: params.id,
      },
      include: {
        items: true,
      },
    })

    if (!order) {
      throw new BusinessLogicError("Order not found")
    }

    // Verify order belongs to this vendor
    if (order.vendorStoreId !== vendorStore.id) {
      throw new BusinessLogicError("Forbidden")
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

    return successResponse({ order: formattedOrder })
  } catch (error) {
    return handleApiError(error, 'Fetch order')
  }
}
