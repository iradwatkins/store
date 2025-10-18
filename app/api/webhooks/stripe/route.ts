import { NextResponse } from "next/server"
import Stripe from "stripe"
import prisma from "@/lib/db"
import redis from "@/lib/redis"
import { sendOrderConfirmation, sendVendorNewOrderAlert, sendOrderPaymentFailed, sendOrderRefundConfirmation } from "@/lib/email"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      )
    }

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata

  try {
    // Check if order already exists
    const existingOrder = await prisma.storeOrder.findUnique({
      where: { paymentIntentId: paymentIntent.id },
    })

    if (existingOrder) {
      console.log(`Order already exists for PaymentIntent ${paymentIntent.id}`)
      return
    }

    const shippingInfo = JSON.parse(metadata.shippingInfo)
    const cartSessionId = metadata.cartSessionId

    // Get cart items from Redis
    const cartData = await redis.get(`cart:${cartSessionId}`)
    if (!cartData) {
      console.error(`Cart not found for session ${cartSessionId}`)
      return
    }

    const cart = JSON.parse(cartData as string)

    // Create order in database
    const order = await prisma.storeOrder.create({
      data: {
        orderNumber: metadata.orderNumber,
        vendorStoreId: metadata.vendorStoreId,
        customerId: metadata.customerId || null,
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
        paymentIntentId: paymentIntent.id,
        paymentStatus: "PAID",
        paidAt: new Date(),
        status: "PAID",
      },
    })

    // Clear cart from Redis
    await redis.del(`cart:${cartSessionId}`)

    // Update vendor store stats
    const updatedStore = await prisma.vendorStore.update({
      where: { id: metadata.vendorStoreId },
      data: {
        totalOrders: { increment: 1 },
        totalSales: { increment: parseFloat(metadata.vendorPayout) },
      },
    })

    // Increment order count for tenant (if applicable)
    if (updatedStore.tenantId) {
      await prisma.tenant.update({
        where: { id: updatedStore.tenantId },
        data: { currentOrders: { increment: 1 } },
      })
    }

    // Update product sales counts and inventory
    for (const item of cart.items) {
      // Fetch product to check current stock
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      })

      if (!product) {
        console.error(`Product ${item.productId} not found during inventory update`)
        continue
      }

      // Update sales count and inventory (only if tracking inventory)
      if (product.trackInventory) {
        if (item.variantId) {
          // Update variant inventory
          const variant = product.variants.find((v) => v.id === item.variantId)
          if (variant && variant.quantity >= item.quantity) {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: {
                quantity: { decrement: item.quantity },
              },
            })
          } else {
            console.error(`Insufficient variant stock for ${product.name} (${item.variantId})`)
          }
        } else {
          // Update product inventory
          if (product.quantity >= item.quantity) {
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                quantity: { decrement: item.quantity },
              },
            })
          } else {
            console.error(`Insufficient product stock for ${product.name}`)
          }
        }
      }

      // Always update sales count
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          salesCount: { increment: item.quantity },
        },
      })
    }

    console.log(`Order ${order.orderNumber} created successfully via webhook`)

    // Fetch order with full details for emails
    const fullOrder = await prisma.storeOrder.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendorStore: {
                  select: {
                    name: true,
                    email: true,
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!fullOrder) {
      console.error("Order not found after creation")
      return
    }

    // Send order confirmation email to customer
    try {
      await sendOrderConfirmation({
        customerName: fullOrder.customerName,
        customerEmail: fullOrder.customerEmail,
        orderNumber: fullOrder.orderNumber,
        orderDate: fullOrder.createdAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        items: fullOrder.items.map((item) => ({
          name: item.name + (item.variantName ? ` (${item.variantName})` : ""),
          quantity: item.quantity,
          price: Number(item.price),
          imageUrl: item.imageUrl || undefined,
        })),
        subtotal: Number(fullOrder.subtotal),
        shippingCost: Number(fullOrder.shippingCost),
        tax: Number(fullOrder.taxAmount),
        total: Number(fullOrder.total),
        shippingAddress: {
          street: fullOrder.shippingAddress.addressLine1 + (fullOrder.shippingAddress.addressLine2 ? `, ${fullOrder.shippingAddress.addressLine2}` : ""),
          city: fullOrder.shippingAddress.city,
          state: fullOrder.shippingAddress.state,
          postalCode: fullOrder.shippingAddress.zipCode,
          country: "USA",
        },
        estimatedDelivery: "5-7 business days",
      })
      console.log(`Order confirmation email sent to ${fullOrder.customerEmail}`)
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError)
      // Don't fail the webhook if email fails
    }

    // Send new order alert email to vendor
    try {
      const vendorStore = fullOrder.items[0]?.product.vendorStore
      if (vendorStore) {
        // Get vendor user details
        const vendorUser = await prisma.user.findUnique({
          where: { id: vendorStore.userId },
          select: { name: true, email: true },
        })

        if (vendorUser) {
          await sendVendorNewOrderAlert({
            vendorName: vendorUser.name || "Vendor",
            vendorEmail: vendorUser.email,
            storeName: vendorStore.name,
            orderNumber: fullOrder.orderNumber,
            orderDate: fullOrder.createdAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            customerName: fullOrder.customerName,
            items: fullOrder.items.map((item) => ({
              name: item.name + (item.variantName ? ` (${item.variantName})` : ""),
              quantity: item.quantity,
              price: Number(item.price),
            })),
            total: Number(fullOrder.vendorPayout),
            shippingAddress: {
              street: fullOrder.shippingAddress.addressLine1 + (fullOrder.shippingAddress.addressLine2 ? `, ${fullOrder.shippingAddress.addressLine2}` : ""),
              city: fullOrder.shippingAddress.city,
              state: fullOrder.shippingAddress.state,
              postalCode: fullOrder.shippingAddress.zipCode,
            },
            orderDetailsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${fullOrder.id}`,
          })
          console.log(`Vendor alert email sent to ${vendorUser.email}`)
        }
      }
    } catch (emailError) {
      console.error("Failed to send vendor alert email:", emailError)
      // Don't fail the webhook if email fails
    }
  } catch (error) {
    console.error("Error handling payment_intent.succeeded:", error)
    throw error
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment failed for PaymentIntent ${paymentIntent.id}`)

  const metadata = paymentIntent.metadata

  // Update order if it exists
  const order = await prisma.storeOrder.findUnique({
    where: { paymentIntentId: paymentIntent.id },
  })

  if (order) {
    await prisma.storeOrder.update({
      where: { id: order.id },
      data: {
        paymentStatus: "FAILED",
        status: "CANCELLED",
      },
    })

    // Send payment failed email to customer
    try {
      await sendOrderPaymentFailed({
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        orderNumber: order.orderNumber,
        amount: Number(order.total),
        failureReason: paymentIntent.last_payment_error?.message,
        retryPaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?retry=${order.id}`,
      })
      console.log(`Payment failed email sent to ${order.customerEmail}`)
    } catch (emailError) {
      console.error("Failed to send payment failed email:", emailError)
      // Don't fail the webhook if email fails
    }
  } else if (metadata.customerEmail && metadata.orderNumber && metadata.total) {
    // If order doesn't exist yet, send email based on metadata
    try {
      await sendOrderPaymentFailed({
        customerName: metadata.customerName || "Customer",
        customerEmail: metadata.customerEmail,
        orderNumber: metadata.orderNumber,
        amount: parseFloat(metadata.total),
        failureReason: paymentIntent.last_payment_error?.message,
        retryPaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
      })
      console.log(`Payment failed email sent to ${metadata.customerEmail}`)
    } catch (emailError) {
      console.error("Failed to send payment failed email:", emailError)
    }
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string

  if (!paymentIntentId) {
    console.log("No payment intent ID found for refunded charge")
    return
  }

  const order = await prisma.storeOrder.findUnique({
    where: { paymentIntentId },
  })

  if (!order) {
    console.log(`Order not found for PaymentIntent ${paymentIntentId}`)
    return
  }

  const refundAmount = charge.amount_refunded / 100 // Convert from cents
  const isFullRefund = charge.refunded

  await prisma.storeOrder.update({
    where: { id: order.id },
    data: {
      paymentStatus: isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
      status: isFullRefund ? "REFUNDED" : order.status,
      refundedAt: isFullRefund ? new Date() : order.refundedAt,
      refundAmount,
    },
  })

  console.log(`Order ${order.orderNumber} refunded: $${refundAmount}`)

  // Send refund confirmation email to customer
  try {
    await sendOrderRefundConfirmation({
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      orderNumber: order.orderNumber,
      refundAmount,
      refundDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      originalAmount: Number(order.total),
      isPartialRefund: !isFullRefund,
      refundReason: order.cancelReason || undefined,
    })
    console.log(`Refund confirmation email sent to ${order.customerEmail}`)
  } catch (emailError) {
    console.error("Failed to send refund confirmation email:", emailError)
    // Don't fail the webhook if email fails
  }

  // TODO: Restore inventory if needed
}
