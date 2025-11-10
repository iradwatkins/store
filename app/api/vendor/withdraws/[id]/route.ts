import { NextRequest } from "next/server"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"
import {
  requireAuth,
  requireVendorStore,
  handleApiError,
  successResponse,
} from "@/lib/utils/api"
import { BusinessLogicError } from "@/lib/errors"

// GET /api/vendor/withdraws/[id] - Get single withdraw
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    // Get withdraw
    const withdraw = await prisma.vendorWithdraw.findFirst({
      where: {
        id: params.id,
        vendorStoreId: vendorStore.id,
      },
    })

    if (!withdraw) {
      throw new BusinessLogicError("Withdraw not found")
    }

    return successResponse({
      withdraw: {
        id: withdraw.id,
        amount: Number(withdraw.amount),
        method: withdraw.method,
        status: withdraw.status,
        requestedAt: withdraw.requestedAt.toISOString(),
        processedAt: withdraw.processedAt?.toISOString() || null,
        notes: withdraw.notes,
        adminNotes: withdraw.adminNotes,
        bankDetails: withdraw.bankDetails,
      },
    })
  } catch (error) {
    return handleApiError(error, 'Fetch withdraw')
  }
}

// DELETE /api/vendor/withdraws/[id] - Cancel withdraw (only if PENDING)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    // Get withdraw
    const withdraw = await prisma.vendorWithdraw.findFirst({
      where: {
        id: params.id,
        vendorStoreId: vendorStore.id,
      },
    })

    if (!withdraw) {
      throw new BusinessLogicError("Withdraw not found")
    }

    // Check if can be cancelled
    if (withdraw.status !== "PENDING") {
      throw new BusinessLogicError("Only pending withdraws can be cancelled")
    }

    // Cancel withdraw and restore balance
    await prisma.$transaction([
      prisma.vendorWithdraw.update({
        where: { id: params.id },
        data: { status: "CANCELLED" },
      }),
      prisma.vendor_stores.update({
        where: { id: vendorStore.id },
        data: {
          withdrawBalance: {
            increment: Number(withdraw.amount),
          },
        },
      }),
    ])

    logger.info(`Withdraw cancelled: ${withdraw.id}`)

    return successResponse({
      message: "Withdraw request cancelled successfully",
    })
  } catch (error) {
    return handleApiError(error, 'Cancel withdraw')
  }
}
