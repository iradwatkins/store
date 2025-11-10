import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { sendAbandonedCartRecovery } from "@/lib/email"
import { logger } from "@/lib/logger"

/**
 * GET /api/cron/send-abandoned-cart-emails
 * Cron job to send abandoned cart recovery emails
 * Runs hourly to check for carts abandoned 1 hour ago
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Calculate time windows for different reminder stages
    const now = new Date()

    // 1st reminder: 1-2 hours after cart creation
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

    // 2nd reminder: 24-25 hours after cart creation
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000)

    // 3rd reminder: 48-49 hours after cart creation
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const fortyNineHoursAgo = new Date(now.getTime() - 49 * 60 * 60 * 1000)

    // Find carts for 1st reminder
    const cartsFor1stReminder = await prisma.abandoned_carts.findMany({
      where: {
        createdAt: { gte: twoHoursAgo, lte: oneHourAgo },
        isRecovered: false,
        expiresAt: { gte: new Date() },
        customerEmail: { not: null },
        reminderSentAt: null,
      },
      include: {
        vendor_stores: {
          select: { name: true, slug: true },
        },
      },
      take: 50,
    })

    // Find carts for 2nd reminder
    const cartsFor2ndReminder = await prisma.abandoned_carts.findMany({
      where: {
        createdAt: { gte: twentyFiveHoursAgo, lte: twentyFourHoursAgo },
        isRecovered: false,
        expiresAt: { gte: new Date() },
        customerEmail: { not: null },
        reminderSentAt: { not: null },
        secondReminderSentAt: null,
      },
      include: {
        vendor_stores: {
          select: { name: true, slug: true },
        },
      },
      take: 50,
    })

    // Find carts for 3rd reminder
    const cartsFor3rdReminder = await prisma.abandoned_carts.findMany({
      where: {
        createdAt: { gte: fortyNineHoursAgo, lte: fortyEightHoursAgo },
        isRecovered: false,
        expiresAt: { gte: new Date() },
        customerEmail: { not: null },
        secondReminderSentAt: { not: null },
        thirdReminderSentAt: null,
      },
      include: {
        vendor_stores: {
          select: { name: true, slug: true },
        },
      },
      take: 50,
    })

    const abandonedCarts = [...cartsFor1stReminder, ...cartsFor2ndReminder, ...cartsFor3rdReminder]

    logger.info(`Found ${cartsFor1stReminder.length} carts for 1st reminder, ${cartsFor2ndReminder.length} for 2nd, ${cartsFor3rdReminder.length} for 3rd`)

    const results = {
      total: abandonedCarts.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const cart of abandonedCarts) {
      try {
        if (!cart.customerEmail) continue

        // Determine which reminder stage this is
        const reminderStage = !cart.reminderSentAt ? 1
                            : !cart.secondReminderSentAt ? 2
                            : 3

        const cartData = cart.cartData as any
        const cartItems = (cartData.items || []).map((item: any) => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.image || undefined,
        }))

        // Calculate days until expiration
        const daysUntilExpiry = Math.ceil(
          (cart.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )

        const recoveryUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/cart/recover?token=${cart.recoveryToken}`

        // Customize subject line based on reminder stage
        const subjects = [
          `You left items in your cart at ${cart.vendor_stores.name}`,
          `Don't miss out! ${cart.discountPercent}% OFF your cart at ${cart.vendor_stores.name}`,
          `Last chance! Your cart expires soon - ${cart.vendor_stores.name}`,
        ]

        await sendAbandonedCartRecovery({
          customerName: cart.customerName || "Customer",
          customerEmail: cart.customerEmail,
          storeName: cart.vendor_stores.name,
          cartItems,
          cartTotal: Number(cart.cartTotal),
          recoveryUrl,
          expiresIn: `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}`,
          discountCode: cart.discountCode || undefined,
          discountPercent: cart.discountPercent,
          reminderStage,
        })

        // Update the appropriate reminder timestamp
        const updateData: any = {}
        if (reminderStage === 1) {
          updateData.reminderSentAt = new Date()
        } else if (reminderStage === 2) {
          updateData.secondReminderSentAt = new Date()
        } else if (reminderStage === 3) {
          updateData.thirdReminderSentAt = new Date()
        }

        await prisma.abandoned_carts.update({
          where: { id: cart.id },
          data: updateData,
        })

        results.sent++
        logger.info(`Sent ${reminderStage}${reminderStage === 1 ? 'st' : reminderStage === 2 ? 'nd' : 'rd'} reminder to ${cart.customerEmail}`)
      } catch (error) {
        results.failed++
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        results.errors.push(`Cart ${cart.id}: ${errorMsg}`)
        logger.error(`Failed to send abandoned cart email for cart ${cart.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    logger.error("Error in abandoned cart email cron job:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send emails",
      },
      { status: 500 }
    )
  }
}
