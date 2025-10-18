import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { sendShippingNotification } from "@/lib/email"


export async function POST(
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

    // Get request body
    const body = await request.json()
    const { carrier, trackingNumber, shippingDate, notes } = body

    // Validate required fields
    if (!carrier || !shippingDate) {
      return NextResponse.json(
        { error: "Carrier and shipping date are required" },
        { status: 400 }
      )
    }

    // Fetch order
    const order = await prisma.storeOrder.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Verify order belongs to this vendor
    if (order.vendorStoreId !== vendorStore.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Verify order is paid
    if (order.paymentStatus !== "PAID") {
      return NextResponse.json(
        { error: "Can only fulfill paid orders" },
        { status: 400 }
      )
    }

    // Verify order is not already fulfilled
    if (order.fulfillmentStatus !== "UNFULFILLED") {
      return NextResponse.json(
        { error: "Order has already been fulfilled" },
        { status: 400 }
      )
    }

    // Update order
    const updatedOrder = await prisma.storeOrder.update({
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
            name: true,
            variantName: true,
            quantity: true,
            imageUrl: true,
          },
        },
      },
    })

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

        console.log(`Shipping notification email sent to ${updatedOrder.customerEmail}`)
      } catch (emailError) {
        console.error("Failed to send shipping notification email:", emailError)
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
    console.error("Error fulfilling order:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fulfill order",
      },
      { status: 500 }
    )
  }
}
