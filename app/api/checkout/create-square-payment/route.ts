import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import redis from "@/lib/redis"
import prisma from "@/lib/db"
import squareClient from "@/lib/square"
import { applyRateLimit, rateLimitConfigs } from "@/lib/rate-limit-api"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"

// Zod validation schemas
const shippingInfoSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().regex(/^\+?1?\s*\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/, "Invalid phone number"),
  fullName: z.string().min(2, "Name too short").max(100, "Name too long"),
  addressLine1: z.string().min(5, "Address too short").max(200, "Address too long"),
  addressLine2: z.string().max(200, "Address too long").optional().default(""),
  city: z.string().min(2, "City too short").max(100, "City too long"),
  state: z.string().length(2, "State must be 2-letter code").regex(/^[A-Z]{2}$/, "Invalid state code"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
})

const shippingMethodSchema = z.object({
  id: z.enum(["standard", "express", "local_pickup"]),
  name: z.string().min(1).max(100),
  price: z.number().min(0).max(1000),
  estimatedDays: z.string().max(50),
})

const requestSchema = z.object({
  shippingInfo: shippingInfoSchema,
  shippingMethod: shippingMethodSchema,
  sourceId: z.string().min(1, "Payment source required"), // Square nonce from Web Payments SDK (supports cards + Cash App)
  paymentMethod: z.enum(["CARD", "CASH_APP"]).optional().default("CARD"), // Payment method type
})

// State-based tax rates
const STATE_TAX_RATES: Record<string, number> = {
  AL: 0.04, AK: 0.0, AZ: 0.056, AR: 0.065, CA: 0.0725, CO: 0.029, CT: 0.0635,
  DE: 0.0, FL: 0.06, GA: 0.04, HI: 0.04, ID: 0.06, IL: 0.0625, IN: 0.07,
  IA: 0.06, KS: 0.065, KY: 0.06, LA: 0.0445, ME: 0.055, MD: 0.06, MA: 0.0625,
  MI: 0.06, MN: 0.06875, MS: 0.07, MO: 0.04225, MT: 0.0, NE: 0.055, NV: 0.0685,
  NH: 0.0, NJ: 0.06625, NM: 0.05125, NY: 0.04, NC: 0.0475, ND: 0.05, OH: 0.0575,
  OK: 0.045, OR: 0.0, PA: 0.06, RI: 0.07, SC: 0.06, SD: 0.045, TN: 0.07,
  TX: 0.0625, UT: 0.0485, VT: 0.06, VA: 0.053, WA: 0.065, WV: 0.06, WI: 0.05, WY: 0.04,
}

function calculateTax(subtotal: number, shippingCost: number, state: string): number {
  const taxRate = STATE_TAX_RATES[state] || 0.0625
  return (subtotal + shippingCost) * taxRate
}

export async function POST(request: NextRequest) {
  try {
    // Get session for customerId
    const session = await auth()

    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(request, rateLimitConfigs.payment)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Validate input
    const body = await request.json()
    const validationResult = requestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { shippingInfo, shippingMethod, sourceId, paymentMethod } = validationResult.data

    // Get cart from Redis
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("cart_id")?.value

    if (!sessionId) {
      return NextResponse.json(
        { error: "No cart session found" },
        { status: 400 }
      )
    }

    const cartData = await redis.get(`cart:${sessionId}`)

    if (!cartData) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      )
    }

    const cart = JSON.parse(cartData as string)

    if (!cart.items || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    )

    const shippingCost = shippingMethod.price
    const taxAmount = calculateTax(subtotal, shippingCost, shippingInfo.state)
    const total = subtotal + shippingCost + taxAmount

    // Get vendor store info
    const vendorStore = await prisma.vendor_stores.findUnique({
      where: { slug: cart.storeSlug },
      select: {
        id: true,
        name: true,
        email: true,
        squareLocationId: true,
        platformFeePercent: true,
      },
    })

    if (!vendorStore) {
      return NextResponse.json(
        { error: "Vendor store not found" },
        { status: 404 }
      )
    }

    if (!vendorStore.squareLocationId) {
      return NextResponse.json(
        { error: "Store not configured for Square payments" },
        { status: 400 }
      )
    }

    // Calculate platform fee
    const platformFeePercent = Number(vendorStore.platformFeePercent) || 7.0
    const platformFee = total * (platformFeePercent / 100)
    const vendorPayout = total - platformFee

    // Generate unique order number
    const orderNumber = `SL-ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // Generate idempotency key for Square
    const idempotencyKey = randomUUID()

    // Create Square Payment with Cash App support (latest API)
    const paymentPayload: any = {
      sourceId,
      idempotencyKey,
      amountMoney: {
        amount: BigInt(Math.round(total * 100)), // Convert to cents
        currency: 'USD',
      },
      locationId: vendorStore.squareLocationId,
      referenceId: orderNumber,
      note: `Order ${orderNumber} for ${vendorStore.name} - Payment: ${paymentMethod}`,
      buyerEmailAddress: shippingInfo.email,
      // API Version - Latest 2025-09-24
      // Autocomplete enabled for faster processing
      autocomplete: true,
    }

    // Add Cash App specific configuration if using Cash App
    if (paymentMethod === 'CASH_APP') {
      paymentPayload.cashDetails = {
        buyerSuppliedMoney: {
          amount: BigInt(Math.round(total * 100)),
          currency: 'USD',
        },
      }
    }

    const payment = await squareClient.payments.create(paymentPayload)

    // Create order in database immediately (since Square doesn't use webhooks the same way)
    const order = await prisma.store_orders.create({
      data: {
        orderNumber,
        vendorStoreId: vendorStore.id,
        customerId: session?.user?.id,
        customerName: shippingInfo.fullName,
        customerEmail: shippingInfo.email,
        customerPhone: shippingInfo.phone,
        shippingAddress: {
          fullName: shippingInfo.fullName,
          addressLine1: shippingInfo.addressLine1,
          addressLine2: shippingInfo.addressLine2,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.zipCode,
          phone: shippingInfo.phone,
        },
        subtotal,
        taxAmount,
        taxRate: STATE_TAX_RATES[shippingInfo.state] || 0.0625,
        shippingCost,
        total,
        platformFee,
        vendorPayout,
        paymentMethod: paymentMethod === 'CASH_APP' ? 'CASH_APP' : 'SQUARE',
        paymentIntentId: payment.payment?.id || '',
        paymentStatus: payment.payment?.status === 'COMPLETED' ? 'PAID' : 'PENDING',
        status: payment.payment?.status === 'COMPLETED' ? 'PAID' : 'PENDING',
        shippingMethod: shippingMethod.id,
        items: {
          create: cart.items.map((item: any) => ({
            productId: item.productId,
            productName: item.name,
            variantId: item.variantId,
            variantName: item.variantName,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    // Clear cart after successful payment
    await redis.del(`cart:${sessionId}`)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      payment: {
        id: payment.payment?.id,
        status: payment.payment?.status,
        receiptUrl: payment.payment?.receiptUrl,
      },
    })
  } catch (error: any) {
    logger.error("Error processing Square payment:", error)

    return NextResponse.json(
      {
        error: "Failed to process payment",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}
