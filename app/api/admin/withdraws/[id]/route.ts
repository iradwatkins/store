import { NextRequest } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import {
  requireAdmin,
  handleApiError,
  successResponse,
} from "@/lib/utils/api"
import { NotFoundError, ValidationError, BusinessLogicError } from "@/lib/errors"

const updateWithdrawSchema = z.object({
  action: z.enum(["approve", "reject", "mark_paid"]),
  adminNotes: z.string().optional(),
})

// PATCH /api/admin/withdraws/[id] - Approve/Reject/Mark Paid
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    // Get withdraw
    const withdraw = await prisma.vendor_withdraws.findUnique({
      where: { id: params.id },
      include: {
        vendor_stores: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!withdraw) {
      throw new NotFoundError('Withdraw not found')
    }

    // Parse request
    const body = await request.json()
    const validatedData = updateWithdrawSchema.parse(body)

    let updatedWithdraw

    switch (validatedData.action) {
      case "approve":
        if (withdraw.status !== "PENDING") {
          throw new BusinessLogicError('Only pending withdraws can be approved')
        }

        updatedWithdraw = await prisma.vendor_withdraws.update({
          where: { id: params.id },
          data: {
            status: "APPROVED",
            adminNotes: validatedData.adminNotes,
          },
        })
        break

      case "reject":
        if (withdraw.status !== "PENDING") {
          throw new BusinessLogicError('Only pending withdraws can be rejected')
        }

        // Reject and restore balance
        await prisma.$transaction([
          prisma.vendor_withdraws.update({
            where: { id: params.id },
            data: {
              status: "REJECTED",
              adminNotes: validatedData.adminNotes,
              processedAt: new Date(),
            },
          }),
          prisma.vendor_stores.update({
            where: { id: withdraw.vendorStoreId },
            data: {
              withdrawBalance: {
                increment: Number(withdraw.amount),
              },
            },
          }),
        ])

        updatedWithdraw = await prisma.vendor_withdraws.findUnique({
          where: { id: params.id },
        })
        break

      case "mark_paid":
        if (withdraw.status !== "APPROVED" && withdraw.status !== "PROCESSING") {
          throw new BusinessLogicError('Only approved/processing withdraws can be marked as paid')
        }

        updatedWithdraw = await prisma.vendor_withdraws.update({
          where: { id: params.id },
          data: {
            status: "PAID",
            processedAt: new Date(),
            adminNotes: validatedData.adminNotes,
          },
        })
        break
    }

    return successResponse({
      message: `Withdraw ${validatedData.action} successfully`,
      withdraw: {
        id: updatedWithdraw!.id,
        status: updatedWithdraw!.status,
        processedAt: updatedWithdraw!.processedAt?.toISOString() || null,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation error', error.issues)
    }
    return handleApiError(error, 'Update withdraw (admin)')
  }
}
