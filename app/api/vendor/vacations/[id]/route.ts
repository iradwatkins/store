/**
 * Single Vacation API
 *
 * PATCH /api/vendor/vacations/[id] - Update vacation
 * DELETE /api/vendor/vacations/[id] - Delete vacation
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import {
  requireAuth,
  requireVendorStore,
  handleApiError,
  successResponse,
} from '@/lib/utils/api'
import { BusinessLogicError } from '@/lib/errors'

const updateVacationSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  message: z.string().optional(),
  isActive: z.boolean().optional(),
})

/**
 * PATCH - Update vacation
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const store = await requireVendorStore(session.user.id)

    // Verify vacation ownership
    const vacation = await prisma.store_vacations.findUnique({
      where: { id: params.id },
      select: { vendorStoreId: true },
    })

    if (!vacation) {
      throw new BusinessLogicError('Vacation not found')
    }

    if (vacation.vendorStoreId !== store.id) {
      throw new BusinessLogicError('Forbidden')
    }

    // Parse and validate request body
    const body = await req.json()
    const validatedData = updateVacationSchema.parse(body)

    // Update vacation
    const updatedVacation = await prisma.store_vacations.update({
      where: { id: params.id },
      data: {
        ...(validatedData.startDate && { startDate: new Date(validatedData.startDate) }),
        ...(validatedData.endDate && { endDate: new Date(validatedData.endDate) }),
        ...(validatedData.message !== undefined && { message: validatedData.message }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
      },
    })

    return successResponse({
      message: 'Vacation updated successfully',
      vacation: updatedVacation,
    })
  } catch (error: any) {
    return handleApiError(error, 'Update vacation')
  }
}

/**
 * DELETE - Delete vacation
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const store = await requireVendorStore(session.user.id)

    // Verify vacation ownership
    const vacation = await prisma.store_vacations.findUnique({
      where: { id: params.id },
      select: { vendorStoreId: true },
    })

    if (!vacation) {
      throw new BusinessLogicError('Vacation not found')
    }

    if (vacation.vendorStoreId !== store.id) {
      throw new BusinessLogicError('Forbidden')
    }

    // Delete vacation
    await prisma.store_vacations.delete({
      where: { id: params.id },
    })

    return successResponse({
      message: 'Vacation deleted successfully',
    })
  } catch (error: any) {
    return handleApiError(error, 'Delete vacation')
  }
}
