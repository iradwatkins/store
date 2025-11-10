import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"
import {
  requireAuth,
  requireVendorStore,
  handleApiError,
} from "@/lib/utils/api"
import { BusinessLogicError } from "@/lib/errors"
import { releaseStock } from "@/lib/stock-management"

/**
 * POST /api/dashboard/orders/[id]/cancel
 * Cancel an order and release stock
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    // Get request body
    const body = await request.json()
    const { reason } = body

    // Fetch order
    const order = await prisma.store_orders.findUnique({
      where: {
        id: params.id,
      },
      include: {
        items: {
          select: {
            productId: true,
            variantId: true,
            quantity: true,
          },
        },
      },
    })

    if (!order) {
      throw new BusinessLogicError("Order not found")
    }

    // Verify order belongs to this vendor
    if (order.vendorStoreId !== vendorStore.id) {
      throw new BusinessLogicError("Forbidden")
    }

    // Verify order can be cancelled
    if (order.status === "CANCELLED") {
      throw new BusinessLogicError("Order is already cancelled")
    }

    if (order.fulfillmentStatus === "SHIPPED" || order.fulfillmentStatus === "DELIVERED") {
      throw new BusinessLogicError("Cannot cancel orders that have been shipped or delivered")
    }

    // Update order status
    const updatedOrder = await prisma.store_orders.update({
      where: {
        id: params.id,
      },
      data: {
        status: "CANCELLED",
        fulfillmentStatus: "CANCELLED",
        internalNotes: reason || "Order cancelled by vendor",
        cancelledAt: new Date(),
      },
    })

    // Release stock (moves from onHold back to available)
    for (const item of order.items) {
      try {
        await releaseStock(
          item.productId,
          item.quantity,
          item.variantId || undefined,
          item.variantCombinationId || undefined
        )
      } catch (error) {
        logger.error(`Failed to release stock for product ${item.productId}:`, error)
        // Continue - cancellation already completed
      }
    }

    // Update vendor store stats
    await prisma.vendor_stores.update({
      where: { id: vendorStore.id },
      data: {
        totalOrders: { decrement: 1 },
        totalSales: { decrement: Number(order.vendorPayout) },
      },
    })

    // Update product sales counts
    for (const item of order.items) {
      await prisma.products.update({
        where: { id: item.productId },
        data: {
          salesCount: { decrement: item.quantity },
        },
      })
    }

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        fulfillmentStatus: updatedOrder.fulfillmentStatus,
        cancelledAt: updatedOrder.cancelledAt?.toISOString(),
      },
    })
  } catch (error) {
    return handleApiError(error, 'Cancel order')
  }
}
