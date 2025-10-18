import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import redis from "@/lib/redis"
import { sendOrderConfirmation, sendVendorNewOrderAlert } from "@/lib/email"

const createCashOrderSchema = z.object({
  cartSessionId: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  shippingAddress: z.object({
    fullName: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    phone: z.string(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createCashOrderSchema.parse(body)

    // Get cart from Redis
    const cartData = await redis.get(`cart:${validatedData.cartSessionId}`)
    if (!cartData) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }

    const cart = JSON.parse(cartData as string)

    if (!cart.items || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    // Get vendor store
    const vendorStoreId = cart.items[0].vendorStoreId
    const vendorStore = await prisma.vendorStore.findUnique({
      where: { id: vendorStoreId },
      select: {
        id: true,
        name: true,
        platformFeePercent: true,
        acceptsCash: true,
        cashInstructions: true,
        userId: true,
      },
    })

    if (!vendorStore) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    if (!vendorStore.acceptsCash) {
      return NextResponse.json(
        { error: "This store does not accept cash payments" },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    )
    const shippingCost = 0 // Cash = pickup, no shipping
    const taxAmount = subtotal * 0.0925 // 9.25% IL tax
    const total = subtotal + shippingCost + taxAmount

    // Calculate platform fee and vendor payout
    const platformFee = total * (Number(vendorStore.platformFeePercent) / 100)
    const vendorPayout = total - platformFee

    // Generate order number
    const orderNumber = `SL-CASH-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // Create order
    const order = await prisma.storeOrder.create({
      data: {
        orderNumber,
        vendorStoreId: vendorStore.id,
        customerEmail: validatedData.customerEmail,
        customerName: validatedData.customerName,
        customerPhone: validatedData.customerPhone,
        shippingAddress: {
          fullName: validatedData.shippingAddress.fullName,
          addressLine1: validatedData.shippingAddress.addressLine1,
          addressLine2: validatedData.shippingAddress.addressLine2 || "",
          city: validatedData.shippingAddress.city,
          state: validatedData.shippingAddress.state,
          zipCode: validatedData.shippingAddress.zipCode,
          phone: validatedData.shippingAddress.phone,
        },
        billingAddress: {
          fullName: validatedData.shippingAddress.fullName,
          addressLine1: validatedData.shippingAddress.addressLine1,
          addressLine2: validatedData.shippingAddress.addressLine2 || "",
          city: validatedData.shippingAddress.city,
          state: validatedData.shippingAddress.state,
          zipCode: validatedData.shippingAddress.zipCode,
          phone: validatedData.shippingAddress.phone,
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
        subtotal,
        shippingCost,
        taxAmount,
        total,
        platformFee,
        vendorPayout,
        paymentProcessor: "CASH",
        paymentStatus: "PENDING", // Cash payment pending
        status: "PENDING",
        shippingMethod: "Local Pickup (Cash)",
      },
      include: {
        items: true,
      },
    })

    // Clear cart from Redis
    await redis.del(`cart:${validatedData.cartSessionId}`)

    // Update vendor store stats
    await prisma.vendorStore.update({
      where: { id: vendorStore.id },
      data: {
        totalOrders: { increment: 1 },
      },
    })

    // Update product sales counts and inventory
    for (const item of cart.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          salesCount: { increment: item.quantity },
          quantity: { decrement: item.quantity },
        },
      })
    }

    // Send order confirmation email to customer
    try {
      await sendOrderConfirmation({
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        orderNumber: order.orderNumber,
        orderDate: order.createdAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        items: order.items.map((item) => ({
          name: item.name + (item.variantName ? ` (${item.variantName})` : ""),
          quantity: item.quantity,
          price: Number(item.price),
          imageUrl: item.imageUrl || undefined,
        })),
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        tax: Number(order.taxAmount),
        total: Number(order.total),
        shippingAddress: {
          street:
            order.shippingAddress.addressLine1 +
            (order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""),
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.zipCode,
          country: "USA",
        },
        estimatedDelivery: "Pickup (see cash instructions)",
      })
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError)
    }

    // Send new order alert email to vendor
    try {
      const vendorUser = await prisma.user.findUnique({
        where: { id: vendorStore.userId },
        select: { name: true, email: true },
      })

      if (vendorUser) {
        await sendVendorNewOrderAlert({
          vendorName: vendorUser.name || "Vendor",
          vendorEmail: vendorUser.email,
          storeName: vendorStore.name,
          orderNumber: order.orderNumber,
          orderDate: order.createdAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          customerName: order.customerName,
          items: order.items.map((item) => ({
            name: item.name + (item.variantName ? ` (${item.variantName})` : ""),
            quantity: item.quantity,
            price: Number(item.price),
          })),
          total: Number(order.vendorPayout),
          shippingAddress: {
            street:
              order.shippingAddress.addressLine1 +
              (order.shippingAddress.addressLine2
                ? `, ${order.shippingAddress.addressLine2}`
                : ""),
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postalCode: order.shippingAddress.zipCode,
          },
          orderDetailsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${order.id}`,
        })
      }
    } catch (emailError) {
      console.error("Failed to send vendor alert email:", emailError)
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        paymentStatus: order.paymentStatus,
        cashInstructions: vendorStore.cashInstructions,
      },
    })
  } catch (error) {
    console.error("Error creating cash order:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
