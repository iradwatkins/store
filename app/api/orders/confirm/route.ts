import { NextResponse } from "next/server"
import Stripe from "stripe"
import prisma from "@/lib/db"
import redis from "@/lib/redis"
import { logger } from "@/lib/logger"
import { reserveStock } from "@/lib/stock-management"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentIntentId = searchParams.get("payment_intent")

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent ID required" },
        { status: 400 }
      )
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      )
    }

    const metadata = paymentIntent.metadata

    // Check if order already exists
    let order = await prisma.store_orders.findUnique({
      where: { paymentIntentId },
      include: {
        items: true,
        vendor_stores: {
          select: {
            name: true,
            slug: true,
            email: true,
          },
        },
      },
    })

    // If order doesn't exist, create it
    if (!order) {
      const shippingInfo = JSON.parse(metadata.shippingInfo)
      const cartSessionId = metadata.cartSessionId

      // Get cart items from Redis
      const cartData = await redis.get(`cart:${cartSessionId}`)
      if (!cartData) {
        return NextResponse.json(
          { error: "Cart not found" },
          { status: 404 }
        )
      }

      const cart = JSON.parse(cartData as string)

      // Create order
      order = await prisma.store_orders.create({
        data: {
          orderNumber: metadata.orderNumber,
          vendorStoreId: metadata.vendorStoreId,
          customerEmail: metadata.customerEmail,
          customerName: metadata.customerName,
          shippingAddress: {
            fullName: shippingInfo.fullName,
            addressLine1: shippingInfo.addressLine1,
            addressLine2: shippingInfo.addressLine2 || "",
            city: shippingInfo.city,
            state: shippingInfo.state,
            zipCode: shippingInfo.zipCode,
            phone: shippingInfo.phone,
          },
          billingAddress: {
            fullName: shippingInfo.fullName,
            addressLine1: shippingInfo.addressLine1,
            addressLine2: shippingInfo.addressLine2 || "",
            city: shippingInfo.city,
            state: shippingInfo.state,
            zipCode: shippingInfo.zipCode,
            phone: shippingInfo.phone,
          },
          items: {
            create: cart.items.map((item: any) => ({
              productId: item.productId,
              variantId: item.variantId,
              name: item.productName,
              variantName: item.variantName,
              price: item.price,
              quantity: item.quantity,
              imageUrl: item.image,
            })),
          },
          subtotal: parseFloat(metadata.subtotal),
          shippingCost: parseFloat(metadata.shippingCost),
          taxAmount: parseFloat(metadata.taxAmount),
          total: parseFloat(metadata.total),
          platformFee: parseFloat(metadata.platformFee),
          vendorPayout: parseFloat(metadata.vendorPayout),
          shippingMethod: metadata.shippingMethodName,
          paymentIntentId,
          paymentStatus: "PAID",
          paidAt: new Date(),
          status: "PAID",
        },
        include: {
          items: true,
          vendor_stores: {
            select: {
              name: true,
              slug: true,
              email: true,
            },
          },
        },
      })

      // Clear cart from Redis
      await redis.del(`cart:${cartSessionId}`)

      // Update vendor store stats
      await prisma.vendor_stores.update({
        where: { id: metadata.vendorStoreId },
        data: {
          totalOrders: { increment: 1 },
          totalSales: { increment: parseFloat(metadata.vendorPayout) },
        },
      })

      // Reserve stock and update product sales counts
      for (const item of cart.items) {
        // Reserve stock (moves from available to onHold)
        const stockReserved = await reserveStock(
          item.productId,
          item.quantity,
          item.variantId || undefined,
          item.variantCombinationId || undefined
        )

        if (!stockReserved) {
          logger.error(`Failed to reserve stock for product ${item.productId}`)
          // Continue anyway - order is already paid
        }

        // Update sales count
        await prisma.products.update({
          where: { id: item.productId },
          data: {
            salesCount: { increment: item.quantity },
          },
        })
      }
    }

    // Format order data for response
    const orderData = {
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      shippingAddress: order.shippingAddress as any,
      items: order.items.map((item) => ({
        name: item.name,
        variantName: item.variantName,
        quantity: item.quantity,
        price: Number(item.price),
        imageUrl: item.imageUrl,
      })),
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      taxAmount: Number(order.taxAmount),
      total: Number(order.total),
      vendor_stores: order.vendor_stores,
    }

    return NextResponse.json({ order: orderData })
  } catch (error) {
    logger.error("Error confirming order:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to confirm order",
      },
      { status: 500 }
    )
  }
}
