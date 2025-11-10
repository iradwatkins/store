/**
 * Single Shipping Rate API
 *
 * PATCH /api/vendor/shipping/zones/[id]/rates/[rateId] - Update rate
 * DELETE /api/vendor/shipping/zones/[id]/rates/[rateId] - Delete rate
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

const updateRateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['FLAT_RATE', 'FREE_SHIPPING', 'WEIGHT_BASED', 'LOCAL_PICKUP']).optional(),
  cost: z.number().min(0).optional(),
  minOrderAmount: z.number().min(0).nullable().optional(),
  isEnabled: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

/**
 * PATCH - Update rate
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; rateId: string } }
) {
  try {
    const session = await requireAuth()
    const store = await requireVendorStore(session.user.id)

    // Verify zone ownership
    const zone = await prisma.shipping_zones.findUnique({
      where: { id: params.id },
      select: { vendorStoreId: true },
    })

    if (!zone) {
      throw new BusinessLogicError('Zone not found')
    }

    if (zone.vendorStoreId !== store.id) {
      throw new BusinessLogicError('Forbidden')
    }

    // Verify rate exists in this zone
    const rate = await prisma.shipping_rates.findUnique({
      where: { id: params.rateId },
      select: { zoneId: true },
    })

    if (!rate) {
      throw new BusinessLogicError('Rate not found')
    }

    if (rate.zoneId !== params.id) {
      throw new BusinessLogicError('Rate does not belong to this zone')
    }

    // Parse and validate request body
    const body = await req.json()
    const validatedData = updateRateSchema.parse(body)

    // Update rate
    const updatedRate = await prisma.shipping_rates.update({
      where: { id: params.rateId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.type && { type: validatedData.type }),
        ...(validatedData.cost !== undefined && { cost: validatedData.cost }),
        ...(validatedData.minOrderAmount !== undefined && { minOrderAmount: validatedData.minOrderAmount }),
        ...(validatedData.isEnabled !== undefined && { isEnabled: validatedData.isEnabled }),
        ...(validatedData.sortOrder !== undefined && { sortOrder: validatedData.sortOrder }),
        updatedAt: new Date(),
      },
    })

    return successResponse({
      message: 'Rate updated successfully',
      rate: updatedRate,
    })
  } catch (error: any) {
    return handleApiError(error, 'Update rate')
  }
}

/**
 * DELETE - Delete rate
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; rateId: string } }
) {
  try {
    const session = await requireAuth()
    const store = await requireVendorStore(session.user.id)

    // Verify zone ownership
    const zone = await prisma.shipping_zones.findUnique({
      where: { id: params.id },
      select: { vendorStoreId: true },
    })

    if (!zone) {
      throw new BusinessLogicError('Zone not found')
    }

    if (zone.vendorStoreId !== store.id) {
      throw new BusinessLogicError('Forbidden')
    }

    // Verify rate exists in this zone
    const rate = await prisma.shipping_rates.findUnique({
      where: { id: params.rateId },
      select: { zoneId: true },
    })

    if (!rate) {
      throw new BusinessLogicError('Rate not found')
    }

    if (rate.zoneId !== params.id) {
      throw new BusinessLogicError('Rate does not belong to this zone')
    }

    // Delete rate
    await prisma.shipping_rates.delete({
      where: { id: params.rateId },
    })

    return successResponse({
      message: 'Rate deleted successfully',
    })
  } catch (error: any) {
    return handleApiError(error, 'Delete rate')
  }
}
