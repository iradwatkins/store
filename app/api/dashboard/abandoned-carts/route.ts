import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import {
  requireAuth,
  requireVendorStore,
  handleApiError,
} from "@/lib/utils/api"

/**
 * GET /api/dashboard/abandoned-carts?filter=all|pending|recovered
 * Get abandoned carts for vendor's store with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "all"

    // Build where clause based on filter
    const whereClause: any = {
      vendorStoreId: vendorStore.id,
      expiresAt: {
        gte: new Date(),
      },
    }

    if (filter === "pending") {
      whereClause.isRecovered = false
    } else if (filter === "recovered") {
      whereClause.isRecovered = true
    }
    // "all" filter has no isRecovered constraint

    const abandonedCarts = await prisma.abandoned_carts.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    })

    // Calculate stats
    const totalValue = abandonedCarts.reduce(
      (sum, cart) => sum + Number(cart.cartTotal),
      0
    )

    const withEmail = abandonedCarts.filter((cart) => cart.customerEmail).length
    const withoutEmail = abandonedCarts.length - withEmail

    const recoveredCarts = await prisma.abandoned_carts.count({
      where: {
        vendorStoreId: vendorStore.id,
        isRecovered: true,
      },
    })

    const recoveredValue = await prisma.abandoned_carts.aggregate({
      where: {
        vendorStoreId: vendorStore.id,
        isRecovered: true,
      },
      _sum: {
        cartTotal: true,
      },
    })

    return NextResponse.json({
      success: true,
      carts: abandonedCarts.map((cart) => ({
        id: cart.id,
        customerEmail: cart.customerEmail,
        customerName: cart.customerName,
        cartTotal: Number(cart.cartTotal),
        itemCount: cart.itemCount,
        createdAt: cart.createdAt.toISOString(),
        expiresAt: cart.expiresAt.toISOString(),
        reminderSentAt: cart.reminderSentAt?.toISOString() || null,
        secondReminderSentAt: cart.secondReminderSentAt?.toISOString() || null,
        thirdReminderSentAt: cart.thirdReminderSentAt?.toISOString() || null,
        isRecovered: cart.isRecovered,
        recoveredAt: cart.recoveredAt?.toISOString() || null,
        recoveryToken: cart.recoveryToken,
        discountCode: cart.discountCode,
      })),
      stats: {
        total: abandonedCarts.length,
        totalValue,
        withEmail,
        withoutEmail,
        recovered: recoveredCarts,
        recoveredValue: Number(recoveredValue._sum.cartTotal || 0),
      },
    })
  } catch (error) {
    return handleApiError(error, 'Fetch abandoned carts')
  }
}
