import { NextResponse } from "next/server"
import Stripe from "stripe"
import { z } from "zod"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
})

// Validation schema
const cancelSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID is required"),
  reason: z.string().optional(),
  cancelImmediately: z.boolean().default(false),
})

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validation = cancelSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      )
    }

    const { tenantId, reason, cancelImmediately } = validation.data

    // 3. Verify tenant ownership
    const tenant = await prisma.tenants.findUnique({
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

    // 4. Check if tenant has an active subscription
    if (!tenant.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      )
    }

    // 5. Cancel subscription in Stripe
    let canceledSubscription: Stripe.Subscription

    if (cancelImmediately) {
      // Cancel immediately (no access after cancellation)
      canceledSubscription = await stripe.subscriptions.cancel(
        tenant.stripeSubscriptionId,
        {
          prorate: true,
        }
      )
    } else {
      // Cancel at period end (access until end of billing period)
      canceledSubscription = await stripe.subscriptions.update(
        tenant.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
          metadata: {
            cancellation_reason: reason || "User requested",
            cancelled_at: new Date().toISOString(),
          },
        }
      )
    }

    // 6. Update tenant status
    await prisma.tenants.update({
      where: { id: tenant.id },
      data: {
        subscriptionStatus: cancelImmediately ? "CANCELLED" : "ACTIVE",
        // Note: If canceling at period end, status stays ACTIVE until webhook confirms
      },
    })

    // 7. Calculate access end date
    const accessEndsAt = new Date(canceledSubscription.current_period_end * 1000)

    // 8. Send cancellation confirmation email (TODO: implement)
    // await sendSubscriptionCancelledEmail({
    //   email: tenant.owner.email,
    //   tenantName: tenant.name,
    //   plan: tenant.subscriptionPlan,
    //   accessEndsAt: accessEndsAt,
    //   reason: reason,
    // })

    return NextResponse.json({
      success: true,
      subscriptionId: canceledSubscription.id,
      status: canceledSubscription.status,
      canceledImmediately: cancelImmediately,
      accessEndsAt: accessEndsAt.toISOString(),
      message: cancelImmediately
        ? "Subscription cancelled immediately. Your access has ended."
        : `Subscription will cancel at the end of your billing period (${accessEndsAt.toLocaleDateString()}). You'll continue to have access until then.`,
    })
  } catch (error) {
    logger.error("Error canceling subscription:", error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    )
  }
}

// Get cancellation status (for UI to show if cancellation is scheduled)
export async function GET(request: Request) {
  try {
    // 1. Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Get tenantId from query params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      )
    }

    // 3. Verify tenant ownership
    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    if (tenant.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      )
    }

    // 4. Check subscription status in Stripe
    if (!tenant.stripeSubscriptionId) {
      return NextResponse.json({
        hasCancellation: false,
        status: tenant.subscriptionStatus,
      })
    }

    const subscription = await stripe.subscriptions.retrieve(
      tenant.stripeSubscriptionId
    )

    return NextResponse.json({
      hasCancellation: subscription.cancel_at_period_end,
      status: subscription.status,
      cancelAt: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000).toISOString()
        : null,
      currentPeriodEnd: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
    })
  } catch (error) {
    logger.error("Error getting cancellation status:", error)
    return NextResponse.json(
      { error: "Failed to get cancellation status" },
      { status: 500 }
    )
  }
}
