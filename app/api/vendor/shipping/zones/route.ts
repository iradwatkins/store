/**
 * Shipping Zones API
 *
 * GET /api/vendor/shipping/zones - List all zones
 * POST /api/vendor/shipping/zones - Create new zone
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

const createZoneSchema = z.object({
  name: z.string().min(1).max(100),
  regions: z.any(), // JSON data for regions (countries, states, zip codes)
  isEnabled: z.boolean().default(true),
  priority: z.number().int().min(0).default(0),
})

/**
 * GET - Fetch all shipping zones for vendor
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const store = await requireVendorStore(session.user.id)

    // Fetch zones with rates
    const zones = await prisma.shipping_zones.findMany({
      where: { vendorStoreId: store.id },
      include: {
        shipping_rates: {
          where: { isEnabled: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { priority: 'asc' },
    })

    return successResponse({
      zones,
      total: zones.length,
    })
  } catch (error: any) {
    return handleApiError(error, 'Fetch shipping zones')
  }
}

/**
 * POST - Create a new shipping zone
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const store = await requireVendorStore(session.user.id)

    // Parse and validate request body
    const body = await req.json()
    const validatedData = createZoneSchema.parse(body)

    // Create zone with generated ID
    const zone = await prisma.shipping_zones.create({
      data: {
        id: idGenerators.shippingZone(),
        vendorStoreId: store.id,
        name: validatedData.name,
        regions: validatedData.regions,
        isEnabled: validatedData.isEnabled,
        priority: validatedData.priority,
      },
    })

    return successResponse(
      {
        message: 'Shipping zone created successfully',
        zone,
      },
      201
    )
  } catch (error: any) {
    return handleApiError(error, 'Create shipping zone')
  }
}
