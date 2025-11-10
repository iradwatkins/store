/**
 * Single Shipping Zone API
 *
 * GET /api/vendor/shipping/zones/[id] - Get zone details
 * PATCH /api/vendor/shipping/zones/[id] - Update zone
 * DELETE /api/vendor/shipping/zones/[id] - Delete zone
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

const updateZoneSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  regions: z.any().optional(),
  isEnabled: z.boolean().optional(),
  priority: z.number().int().min(0).optional(),
})

/**
 * GET - Fetch single zone
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const store = await requireVendorStore(session.user.id)

    // Fetch zone
    const zone = await prisma.shipping_zones.findUnique({
      where: { id: params.id },
      include: {
        shipping_rates: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!zone) {
      throw new BusinessLogicError('Zone not found')
    }

    if (zone.vendorStoreId !== store.id) {
      throw new BusinessLogicError('Forbidden')
    }

    return successResponse({ zone })
  } catch (error: any) {
    return handleApiError(error, 'Fetch zone')
  }
}

/**
 * PATCH - Update zone
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    // Parse and validate request body
    const body = await req.json()
    const validatedData = updateZoneSchema.parse(body)

    // Update zone
    const updatedZone = await prisma.shipping_zones.update({
      where: { id: params.id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.regions !== undefined && { regions: validatedData.regions }),
        ...(validatedData.isEnabled !== undefined && { isEnabled: validatedData.isEnabled }),
        ...(validatedData.priority !== undefined && { priority: validatedData.priority }),
        updatedAt: new Date(),
      },
    })

    return successResponse({
      message: 'Zone updated successfully',
      zone: updatedZone,
    })
  } catch (error: any) {
    return handleApiError(error, 'Update zone')
  }
}

/**
 * DELETE - Delete zone
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    // Delete zone (cascade will delete associated rates)
    await prisma.shipping_zones.delete({
      where: { id: params.id },
    })

    return successResponse({
      message: 'Zone deleted successfully',
    })
  } catch (error: any) {
    return handleApiError(error, 'Delete zone')
  }
}
