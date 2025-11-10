import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { sendAbandonedCartRecovery } from "@/lib/email"
import { logger } from "@/lib/logger"
import {
  requireAuth,
  requireVendorStore,
  handleApiError,
} from "@/lib/utils/api"
import { BusinessLogicError } from "@/lib/errors"

/**
 * POST /api/dashboard/abandoned-carts/[id]/send-reminder
 * Manually send abandoned cart recovery email
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    // Find abandoned cart
    const cart = await prisma.abandoned_carts.findUnique({
      where: { id: params.id },
      include: {
        vendor_stores: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!cart) {
      throw new BusinessLogicError("Cart not found")
    }

    // Verify cart belongs to this vendor
    if (cart.vendorStoreId !== vendorStore.id) {
      throw new BusinessLogicError("Forbidden")
    }

    // Check if cart has expired
    if (new Date() > cart.expiresAt) {
      throw new BusinessLogicError("Cart has expired")
    }

    // Check if already recovered
    if (cart.isRecovered) {
      throw new BusinessLogicError("Cart has already been recovered")
    }

    // Check if customer has email
    if (!cart.customerEmail) {
      throw new BusinessLogicError("No email address for this customer")
    }

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

    await sendAbandonedCartRecovery({
      customerName: cart.customerName || "Customer",
      customerEmail: cart.customerEmail,
      storeName: cart.vendor_stores.name,
      cartItems,
      cartTotal: Number(cart.cartTotal),
      recoveryUrl,
      expiresIn: `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}`,
    })

    // Update reminder sent time
    await prisma.abandoned_carts.update({
      where: { id: cart.id },
      data: { reminderSentAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      message: "Recovery email sent successfully",
    })
  } catch (error) {
    logger.error("Error sending abandoned cart reminder:", error)
    return handleApiError(error, 'Send cart reminder')
  }
}
