import { NextResponse } from "next/server"
import Stripe from "stripe"
import prisma from "@/lib/db"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS!

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
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")!

    let event: Stripe.Event

    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("Subscription webhook signature verification failed:", err)
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      )
    }

    // Handle different event types
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(event.data.object as Stripe.Subscription)
        break

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case "invoice.upcoming":
        await handleInvoiceUpcoming(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled subscription event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Subscription webhook error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata.tenantId
  const plan = subscription.metadata.plan

  if (!tenantId || !plan) {
    console.error("Missing metadata in subscription.created event")
    return
  }

  try {
    const quotas = PLAN_QUOTAS[plan as keyof typeof PLAN_QUOTAS]

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status === "active" ? "ACTIVE" : "TRIAL",
        stripePriceId: subscription.items.data[0].price.id,
        subscriptionPlan: plan as any,
        maxProducts: quotas.maxProducts,
        maxOrders: quotas.maxOrders,
        maxStorageGB: quotas.maxStorageGB,
        platformFeePercent: quotas.platformFeePercent,
      },
    })

    console.log(`Subscription created for tenant ${tenantId}: ${subscription.id}`)

    // TODO: Send subscription activated email
  } catch (error) {
    console.error("Error handling subscription.created:", error)
    throw error
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    })

    if (!tenant) {
      console.error(`Tenant not found for subscription ${subscription.id}`)
      return
    }

    // Determine status
    let status: "ACTIVE" | "PAST_DUE" | "CANCELLED" | "PAUSED" = "ACTIVE"
    if (subscription.status === "past_due") status = "PAST_DUE"
    else if (subscription.status === "canceled") status = "CANCELLED"
    else if (subscription.status === "paused") status = "PAUSED"

    // Update tenant
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionStatus: status,
        stripePriceId: subscription.items.data[0].price.id,
      },
    })

    console.log(`Subscription updated for tenant ${tenant.id}: ${subscription.status}`)
  } catch (error) {
    console.error("Error handling subscription.updated:", error)
    throw error
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    })

    if (!tenant) {
      console.error(`Tenant not found for subscription ${subscription.id}`)
      return
    }

    // Update tenant to cancelled status
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionStatus: "CANCELLED",
        // Optionally: Reset quotas to free tier or deactivate
      },
    })

    console.log(`Subscription deleted for tenant ${tenant.id}`)

    // TODO: Send subscription cancelled email
  } catch (error) {
    console.error("Error handling subscription.deleted:", error)
    throw error
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { stripeSubscriptionId: subscription.id },
      include: {
        owner: {
          select: { email: true, name: true },
        },
      },
    })

    if (!tenant) {
      console.error(`Tenant not found for subscription ${subscription.id}`)
      return
    }

    const trialEndsAt = new Date(subscription.trial_end! * 1000)
    const daysRemaining = Math.ceil(
      (trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    console.log(
      `Trial will end for tenant ${tenant.id} in ${daysRemaining} days`
    )

    // TODO: Send trial ending email (3 days before)
    // await sendTrialEndingEmail({
    //   email: tenant.owner.email,
    //   tenantName: tenant.name,
    //   daysRemaining: daysRemaining,
    //   upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tenant-dashboard/billing`,
    // })
  } catch (error) {
    console.error("Error handling trial_will_end:", error)
    // Don't throw - email failure shouldn't break webhook
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { stripeSubscriptionId: invoice.subscription as string },
    })

    if (!tenant) {
      console.error(
        `Tenant not found for subscription ${invoice.subscription}`
      )
      return
    }

    // Create subscription history record
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    )

    const plan = subscription.metadata.plan || tenant.subscriptionPlan

    await prisma.subscriptionHistory.create({
      data: {
        tenantId: tenant.id,
        plan: plan as any,
        amount: invoice.amount_paid / 100,
        stripePriceId: subscription.items.data[0].price.id,
        stripeInvoiceId: invoice.id,
        status: "paid",
        billingPeriodStart: new Date(subscription.current_period_start * 1000),
        billingPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    })

    // Update tenant status to ACTIVE if it was PAST_DUE
    if (tenant.subscriptionStatus === "PAST_DUE") {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { subscriptionStatus: "ACTIVE" },
      })
    }

    console.log(`Payment succeeded for tenant ${tenant.id}: $${invoice.amount_paid / 100}`)

    // TODO: Send payment success email (receipt)
  } catch (error) {
    console.error("Error handling invoice.payment_succeeded:", error)
    throw error
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { stripeSubscriptionId: invoice.subscription as string },
      include: {
        owner: {
          select: { email: true, name: true },
        },
      },
    })

    if (!tenant) {
      console.error(
        `Tenant not found for subscription ${invoice.subscription}`
      )
      return
    }

    // Update tenant status to PAST_DUE
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { subscriptionStatus: "PAST_DUE" },
    })

    console.log(`Payment failed for tenant ${tenant.id}`)

    // TODO: Send payment failed email
    // await sendPaymentFailedEmail({
    //   email: tenant.owner.email,
    //   tenantName: tenant.name,
    //   amount: invoice.amount_due / 100,
    //   updatePaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tenant-dashboard/billing`,
    // })
  } catch (error) {
    console.error("Error handling invoice.payment_failed:", error)
    // Don't throw - email failure shouldn't break webhook
  }
}

async function handleInvoiceUpcoming(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { stripeSubscriptionId: invoice.subscription as string },
      include: {
        owner: {
          select: { email: true, name: true },
        },
      },
    })

    if (!tenant) {
      console.error(
        `Tenant not found for subscription ${invoice.subscription}`
      )
      return
    }

    const dueDate = new Date(invoice.period_end * 1000)

    console.log(
      `Upcoming invoice for tenant ${tenant.id}: $${invoice.amount_due / 100} due ${dueDate.toLocaleDateString()}`
    )

    // TODO: Send upcoming invoice reminder email (7 days before)
    // Only send if payment method might fail or needs updating
  } catch (error) {
    console.error("Error handling invoice.upcoming:", error)
    // Don't throw - email failure shouldn't break webhook
  }
}
