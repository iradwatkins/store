import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { sendShippingNotification } from "@/lib/email"
import { logger } from "@/lib/logger"
import {
  requireAuth,
  requireVendorStore,
  handleApiError,
} from "@/lib/utils/api"
import { BusinessLogicError } from "@/lib/errors"
import { commitStock } from "@/lib/stock-management"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    // Get request body
    const body = await request.json()
    const { carrier, trackingNumber, shippingDate, notes } = body

    // Validate required fields
    if (!carrier || !shippingDate) {
      throw new BusinessLogicError("Carrier and shipping date are required")
    }

    // Fetch order
    const order = await prisma.store_orders.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!order) {
      throw new BusinessLogicError("Order not found")
    }

    // Verify order belongs to this vendor
    if (order.vendorStoreId !== vendorStore.id) {
      throw new BusinessLogicError("Forbidden")
    }

    // Verify order is paid
    if (order.paymentStatus !== "PAID") {
      throw new BusinessLogicError("Can only fulfill paid orders")
    }

    // Verify order is not already fulfilled
    if (order.fulfillmentStatus !== "UNFULFILLED") {
      throw new BusinessLogicError("Order has already been fulfilled")
    }

    // Update order
    const updatedOrder = await prisma.store_orders.update({
      where: {
        id: params.id,
      },
      data: {
        fulfillmentStatus: "SHIPPED",
        carrier,
        trackingNumber: trackingNumber || null,
        shippedAt: new Date(shippingDate),
        internalNotes: notes || null,
      },
      include: {
        items: {
          select: {
            productId: true,
            variantId: true,
            name: true,
            variantName: true,
            quantity: true,
            imageUrl: true,
          },
        },
      },
    })

    // Commit stock (moves from onHold to committed)
    for (const item of updatedOrder.items) {
      try {
        await commitStock(
          item.productId,
          item.quantity,
          item.variantId || undefined,
          item.variantCombinationId || undefined
        )
      } catch (error) {
        logger.error(`Failed to commit stock for product ${item.productId}:`, error)
        // Continue - fulfillment already completed
      }
    }

    // Send shipping notification email to customer
    if (trackingNumber) {
      try {
        // Generate tracking URL based on carrier
        let trackingUrl = ""
        const trackNum = trackingNumber.trim()

        switch (carrier.toUpperCase()) {
          case "USPS":
            trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackNum}`
            break
          case "FEDEX":
            trackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${trackNum}`
            break
          case "UPS":
            trackingUrl = `https://www.ups.com/track?loc=null&tracknum=${trackNum}`
            break
          case "DHL":
            trackingUrl = `https://www.dhl.com/en/express/tracking.html?AWB=${trackNum}`
            break
          default:
            trackingUrl = `#` // Fallback
        }

        // Calculate estimated delivery (5-7 business days from shipping date)
        const shippedDate = new Date(shippingDate)
        const estimatedDeliveryStart = new Date(shippedDate)
        estimatedDeliveryStart.setDate(estimatedDeliveryStart.getDate() + 5)
        const estimatedDeliveryEnd = new Date(shippedDate)
        estimatedDeliveryEnd.setDate(estimatedDeliveryEnd.getDate() + 7)

        const estimatedDelivery = `${estimatedDeliveryStart.toLocaleDateString("en-US", { month: "long", day: "numeric" })}-${estimatedDeliveryEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`

        await sendShippingNotification({
          customerName: updatedOrder.customerName,
          customerEmail: updatedOrder.customerEmail,
          orderNumber: updatedOrder.orderNumber,
          carrier,
          trackingNumber,
          trackingUrl,
          shippedDate: shippedDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          estimatedDelivery,
          items: updatedOrder.items.map((item) => ({
            name: item.name + (item.variantName ? ` (${item.variantName})` : ""),
            quantity: item.quantity,
            imageUrl: item.imageUrl || undefined,
          })),
          shippingAddress: {
            street: updatedOrder.shippingAddress.addressLine1 + (updatedOrder.shippingAddress.addressLine2 ? `, ${updatedOrder.shippingAddress.addressLine2}` : ""),
            city: updatedOrder.shippingAddress.city,
            state: updatedOrder.shippingAddress.state,
            postalCode: updatedOrder.shippingAddress.zipCode,
          },
        })

        logger.info(`Shipping notification email sent to ${updatedOrder.customerEmail}`)
      } catch (emailError) {
        logger.error("Failed to send shipping notification email:", emailError)
        // Don't fail the fulfillment if email fails
      }
    }

    // TODO: Initiate payout to vendor via Stripe Connect

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        fulfillmentStatus: updatedOrder.fulfillmentStatus,
        carrier: updatedOrder.carrier,
        trackingNumber: updatedOrder.trackingNumber,
        shippedAt: updatedOrder.shippedAt?.toISOString(),
      },
    })
  } catch (error) {
    return handleApiError(error, 'Fulfill order')
  }
}
