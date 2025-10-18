import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import Stripe from "stripe"
import prisma from "@/lib/db"
import { z } from "zod"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

// Validation schema
const subscriptionSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID is required"),
  priceId: z.string().min(1, "Price ID is required"),
  paymentMethodId: z.string().optional(),
})

// Plan quotas mapping
const PLAN_QUOTAS = {
  STARTER: {
    maxProducts: 50,
    maxOrders: 100,
    maxStorageGB: 1,
    platformFeePercent: 5.0,
  },
  PRO: {
    maxProducts: 500,
    maxOrders: 1000,
    maxStorageGB: 10,
    platformFeePercent: 3.0,
  },
  ENTERPRISE: {
    maxProducts: 999999,
    maxOrders: 999999,
    maxStorageGB: 100,
    platformFeePercent: 2.0,
  },
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validation = subscriptionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { tenantId, priceId, paymentMethodId } = validation.data

    // 3. Verify tenant ownership
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        owner: {
          select: { email: true, name: true },
        },
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    if (tenant.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to manage this tenant" },
        { status: 403 }
      )
    }

    // 4. Check if tenant already has active subscription
    if (tenant.subscriptionStatus === "ACTIVE" && tenant.stripeSubscriptionId) {
      return NextResponse.json(
        {
          error: "Tenant already has an active subscription",
          subscriptionId: tenant.stripeSubscriptionId,
        },
        { status: 400 }
      )
    }

    // 5. Determine plan from price ID
    const plan = determinePlanFromPriceId(priceId)
    if (!plan) {
      return NextResponse.json(
        { error: "Invalid price ID" },
        { status: 400 }
      )
    }

    // 6. Create or retrieve Stripe Customer
    let stripeCustomerId = tenant.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: tenant.owner.email || undefined,
        name: tenant.owner.name || tenant.name,
        metadata: {
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          ownerId: tenant.ownerId,
        },
      })

      stripeCustomerId = customer.id

      // Update tenant with Stripe Customer ID
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { stripeCustomerId: customer.id },
      })
    }

    // 7. Attach payment method if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      })

      // Set as default payment method
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })
    }

    // 8. Create Stripe Subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        plan: plan,
      },
    })

    // 9. Update tenant with subscription details
    const quotas = PLAN_QUOTAS[plan as keyof typeof PLAN_QUOTAS]

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        subscriptionPlan: plan as any,
        subscriptionStatus: "ACTIVE",
        maxProducts: quotas.maxProducts,
        maxOrders: quotas.maxOrders,
        maxStorageGB: quotas.maxStorageGB,
        platformFeePercent: quotas.platformFeePercent,
        trialEndsAt: null, // Clear trial end date
      },
    })

    // 10. Create subscription history record
    await prisma.subscriptionHistory.create({
      data: {
        tenantId: tenant.id,
        plan: plan as any,
        amount: (subscription.items.data[0].price?.unit_amount || 0) / 100,
        stripePriceId: priceId,
        status: "active",
        billingPeriodStart: new Date(subscription.current_period_start * 1000),
        billingPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    })

    // 11. Get client secret from payment intent
    const latestInvoice = subscription.latest_invoice as Stripe.Invoice
    const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret,
      status: subscription.status,
      plan: plan,
      quotas: quotas,
    })
  } catch (error) {
    console.error("Error creating subscription:", error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    )
  }
}

// Helper function to determine plan from price ID
function determinePlanFromPriceId(priceId: string): string | null {
  const priceIdMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER || ""]: "STARTER",
    [process.env.STRIPE_PRICE_PRO || ""]: "PRO",
    [process.env.STRIPE_PRICE_ENTERPRISE || ""]: "ENTERPRISE",
  }

  return priceIdMap[priceId] || null
}
