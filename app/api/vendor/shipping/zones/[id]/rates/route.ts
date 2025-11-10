/**
 * Shipping Rates API
 *
 * GET /api/vendor/shipping/zones/[id]/rates - List all rates for a zone
 * POST /api/vendor/shipping/zones/[id]/rates - Create new rate
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import {
  requireAuth,
  requireVendorStore,
  handleApiError,
  successResponse,
  idGenerators,
} from '@/lib/utils/api'
import { BusinessLogicError } from '@/lib/errors'

const createRateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['FLAT_RATE', 'FREE_SHIPPING', 'WEIGHT_BASED', 'LOCAL_PICKUP']),
  cost: z.number().min(0),
  minOrderAmount: z.number().min(0).optional(),
  isEnabled: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
})

/**
 * GET - Fetch all rates for a zone
 */
export async function GET(
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

    // Fetch rates
    const rates = await prisma.shipping_rates.findMany({
      where: { zoneId: params.id },
      orderBy: { sortOrder: 'asc' },
    })

    return successResponse({
      rates,
      total: rates.length,
    })
  } catch (error: any) {
    return handleApiError(error, 'Fetch shipping rates')
  }
}

/**
 * POST - Create a new shipping rate
 */
export async function POST(
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
    const validatedData = createRateSchema.parse(body)

    // Create rate with generated ID
    const rate = await prisma.shipping_rates.create({
      data: {
        id: idGenerators.shippingRate(),
        zoneId: params.id,
        name: validatedData.name,
        type: validatedData.type,
        cost: validatedData.cost,
        minOrderAmount: validatedData.minOrderAmount,
        isEnabled: validatedData.isEnabled,
        sortOrder: validatedData.sortOrder,
      },
    })

    return successResponse(
      {
        message: 'Shipping rate created successfully',
        rate,
      },
      201
    )
  } catch (error: any) {
    return handleApiError(error, 'Create shipping rate')
  }
}
