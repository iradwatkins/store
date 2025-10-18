import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import Stripe from "stripe"
import prisma from "@/lib/db"
import { z } from "zod"
import { logger } from "@/lib/logger"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

// Validation schema
const changePlanSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID is required"),
  newPriceId: z.string().min(1, "New price ID is required"),
})

// Plan quotas mapping (same as create-subscription)
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
    const validation = changePlanSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { tenantId, newPriceId } = validation.data

    // 3. Verify tenant ownership
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
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

    // 4. Check if tenant has an active subscription
    if (!tenant.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      )
    }

    // 5. Determine new plan from price ID
    const newPlan = determinePlanFromPriceId(newPriceId)
    if (!newPlan) {
      return NextResponse.json(
        { error: "Invalid price ID" },
        { status: 400 }
      )
    }

    // 6. Check if changing to same plan
    if (tenant.stripePriceId === newPriceId) {
      return NextResponse.json(
        { error: "Already subscribed to this plan" },
        { status: 400 }
      )
    }

    // 7. Get current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      tenant.stripeSubscriptionId
    )

    // 8. Update subscription with new price (prorated)
    const updatedSubscription = await stripe.subscriptions.update(
      tenant.stripeSubscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: "create_prorations", // Prorate charges
        metadata: {
          ...subscription.metadata,
          plan: newPlan,
          changedAt: new Date().toISOString(),
        },
      }
    )

    // 9. Update tenant with new plan quotas
    const newQuotas = PLAN_QUOTAS[newPlan as keyof typeof PLAN_QUOTAS]

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        stripePriceId: newPriceId,
        subscriptionPlan: newPlan as any,
        maxProducts: newQuotas.maxProducts,
        maxOrders: newQuotas.maxOrders,
        maxStorageGB: newQuotas.maxStorageGB,
        platformFeePercent: newQuotas.platformFeePercent,
      },
    })

    // 10. Check if downgrade causes quota violations
    const quotaViolations = []

    if (updatedTenant.currentProducts > newQuotas.maxProducts) {
      quotaViolations.push({
        metric: "products",
        current: updatedTenant.currentProducts,
        limit: newQuotas.maxProducts,
        message: `You have ${updatedTenant.currentProducts} products but the new plan allows ${newQuotas.maxProducts}. Please delete some products.`,
      })
    }

    if (Number(updatedTenant.currentStorageGB) > newQuotas.maxStorageGB) {
      quotaViolations.push({
        metric: "storage",
        current: Number(updatedTenant.currentStorageGB),
        limit: newQuotas.maxStorageGB,
        message: `You are using ${updatedTenant.currentStorageGB}GB but the new plan allows ${newQuotas.maxStorageGB}GB. Please delete some images.`,
      })
    }

    // 11. Create subscription history record
    await prisma.subscriptionHistory.create({
      data: {
        tenantId: tenant.id,
        plan: newPlan as any,
        amount:
          (updatedSubscription.items.data[0].price?.unit_amount || 0) / 100,
        stripePriceId: newPriceId,
        status: "active",
        billingPeriodStart: new Date(
          updatedSubscription.current_period_start * 1000
        ),
        billingPeriodEnd: new Date(
          updatedSubscription.current_period_end * 1000
        ),
      },
    })

    // 12. Determine if upgrade or downgrade
    const planOrder = { TRIAL: 0, STARTER: 1, PRO: 2, ENTERPRISE: 3 }
    const oldPlanLevel = planOrder[tenant.subscriptionPlan as keyof typeof planOrder] || 0
    const newPlanLevel = planOrder[newPlan as keyof typeof planOrder]
    const isUpgrade = newPlanLevel > oldPlanLevel

    return NextResponse.json({
      success: true,
      subscriptionId: updatedSubscription.id,
      oldPlan: tenant.subscriptionPlan,
      newPlan: newPlan,
      isUpgrade: isUpgrade,
      quotas: newQuotas,
      quotaViolations: quotaViolations.length > 0 ? quotaViolations : null,
      proratedAmount: updatedSubscription.latest_invoice
        ? (updatedSubscription.latest_invoice as any).amount_due / 100
        : null,
      message: isUpgrade
        ? "Plan upgraded successfully!"
        : "Plan downgraded successfully. Changes will take effect at the end of your billing period.",
    })
  } catch (error) {
    logger.error("Error changing plan:", error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      { error: "Failed to change plan" },
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
