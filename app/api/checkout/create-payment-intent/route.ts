import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import Stripe from "stripe"
import { z } from "zod"
import redis from "@/lib/redis"
import prisma from "@/lib/db"
import { applyRateLimit, rateLimitConfigs } from "@/lib/rate-limit-api"
import { auth } from "@/lib/auth"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

// P0 FIX: Add Zod validation schemas for input validation
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
})

// P0 FIX: State-based tax rates (replace hard-coded 8.75%)
const STATE_TAX_RATES: Record<string, number> = {
  AL: 0.04,   // Alabama
  AK: 0.0,    // Alaska
  AZ: 0.056,  // Arizona
  AR: 0.065,  // Arkansas
  CA: 0.0725, // California
  CO: 0.029,  // Colorado
  CT: 0.0635, // Connecticut
  DE: 0.0,    // Delaware
  FL: 0.06,   // Florida
  GA: 0.04,   // Georgia
  HI: 0.04,   // Hawaii
  ID: 0.06,   // Idaho
  IL: 0.0625, // Illinois (state rate, local adds ~2-3%)
  IN: 0.07,   // Indiana
  IA: 0.06,   // Iowa
  KS: 0.065,  // Kansas
  KY: 0.06,   // Kentucky
  LA: 0.0445, // Louisiana
  ME: 0.055,  // Maine
  MD: 0.06,   // Maryland
  MA: 0.0625, // Massachusetts
  MI: 0.06,   // Michigan
  MN: 0.06875, // Minnesota
  MS: 0.07,   // Mississippi
  MO: 0.04225, // Missouri
  MT: 0.0,    // Montana
  NE: 0.055,  // Nebraska
  NV: 0.0685, // Nevada
  NH: 0.0,    // New Hampshire
  NJ: 0.06625, // New Jersey
  NM: 0.05125, // New Mexico
  NY: 0.04,   // New York
  NC: 0.0475, // North Carolina
  ND: 0.05,   // North Dakota
  OH: 0.0575, // Ohio
  OK: 0.045,  // Oklahoma
  OR: 0.0,    // Oregon
  PA: 0.06,   // Pennsylvania
  RI: 0.07,   // Rhode Island
  SC: 0.06,   // South Carolina
  SD: 0.045,  // South Dakota
  TN: 0.07,   // Tennessee
  TX: 0.0625, // Texas
  UT: 0.0485, // Utah
  VT: 0.06,   // Vermont
  VA: 0.053,  // Virginia
  WA: 0.065,  // Washington
  WV: 0.06,   // West Virginia
  WI: 0.05,   // Wisconsin
  WY: 0.04,   // Wyoming
}

function calculateTax(subtotal: number, shippingCost: number, state: string): number {
  const taxRate = STATE_TAX_RATES[state] || 0.0625 // Default to IL rate if state not found
  return (subtotal + shippingCost) * taxRate
}

export async function POST(request: NextRequest) {
  try {
    // Get session for customerId
    const session = await auth()

    // Apply rate limiting (10 requests per minute)
    const rateLimitResponse = await applyRateLimit(request, rateLimitConfigs.payment)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // P0 FIX: Validate input with Zod
    const body = await request.json()
    const validationResult = requestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const { shippingInfo, shippingMethod } = validationResult.data

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

    // Validate stock availability before creating payment intent
    for (const item of cart.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      })

      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productName} is no longer available` },
          { status: 400 }
        )
      }

      if (product.trackInventory) {
        const availableStock = item.variantId
          ? product.variants.find((v) => v.id === item.variantId)?.quantity
          : product.quantity

        if (availableStock === undefined || availableStock === null) {
          return NextResponse.json(
            { error: `Stock information unavailable for ${item.productName}` },
            { status: 400 }
          )
        }

        if (availableStock < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${item.productName}. Only ${availableStock} available.` },
            { status: 400 }
          )
        }
      }
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    )

    const shippingCost = shippingMethod.price

    // P0 FIX: Use state-based tax calculation
    const taxAmount = calculateTax(subtotal, shippingCost, shippingInfo.state)
    const total = subtotal + shippingCost + taxAmount

    // Get vendor store info
    const vendorStore = await prisma.vendorStore.findUnique({
      where: { slug: cart.storeSlug },
      select: {
        id: true,
        name: true,
        email: true,
        stripeAccountId: true,
        platformFeePercent: true,
      },
    })

    if (!vendorStore) {
      return NextResponse.json(
        { error: "Vendor store not found" },
        { status: 404 }
      )
    }

    // Calculate platform fee
    const platformFeePercent = Number(vendorStore.platformFeePercent) || 7.0
    const platformFee = total * (platformFeePercent / 100)
    const vendorPayout = total - platformFee

    // Generate unique order number
    const orderNumber = `SL-ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: "usd",
      receipt_email: shippingInfo.email,
      metadata: {
        orderNumber,
        vendorStoreId: vendorStore.id,
        storeName: vendorStore.name,
        customerId: session?.user?.id || "",
        customerEmail: shippingInfo.email,
        customerName: shippingInfo.fullName,
        subtotal: subtotal.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        platformFee: platformFee.toFixed(2),
        vendorPayout: vendorPayout.toFixed(2),
        shippingMethod: shippingMethod.id,
        shippingMethodName: shippingMethod.name,
        shippingInfo: JSON.stringify(shippingInfo),
        cartSessionId: sessionId,
      },
      // If vendor has Stripe Connect, split payment
      ...(vendorStore.stripeAccountId && {
        transfer_data: {
          destination: vendorStore.stripeAccountId,
          amount: Math.round(vendorPayout * 100),
        },
      }),
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderNumber,
    })
  } catch (error) {
    // P0 FIX: Remove sensitive data logging in production
    if (process.env.NODE_ENV !== "production") {
      console.error("Error creating payment intent:", error)
    }

    return NextResponse.json(
      {
        error: "Failed to create payment intent",
        // Don't expose internal error details to client
      },
      { status: 500 }
    )
  }
}
