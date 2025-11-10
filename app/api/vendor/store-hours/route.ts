/**
 * Store Hours API
 *
 * GET /api/vendor/store-hours - Get store hours
 * PUT /api/vendor/store-hours - Update store hours
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import {
  requireAuth,
  requireVendorStore,
  handleApiError,
  successResponse,
  generateId,
} from '@/lib/utils/api'

const dayHoursSchema = z.object({
  open: z.string().optional(),
  close: z.string().optional(),
  closed: z.boolean().default(false),
}).optional().nullable()

const updateStoreHoursSchema = z.object({
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
  sunday: dayHoursSchema,
  timezone: z.string().default('America/New_York'),
  isEnabled: z.boolean().default(true),
})

/**
 * GET - Fetch store hours
 */
export async function GET(req: NextRequest) {
  try {
    // Auth check
    const session = await requireAuth()
    const store = await requireVendorStore(session.user.id)

    // Fetch store hours
    const storeHours = await prisma.store_hours.findUnique({
      where: { vendorStoreId: store.id },
    })

    return successResponse({
      storeHours: storeHours || null,
    })
  } catch (error: any) {
    return handleApiError(error, 'Fetch store hours')
  }
}

/**
 * PUT - Update store hours (upsert)
 */
export async function PUT(req: NextRequest) {
  try {
    // Auth check
    const session = await requireAuth()
    const store = await requireVendorStore(session.user.id)

    // Parse and validate request body
    const body = await req.json()
    const validatedData = updateStoreHoursSchema.parse(body)

    // Upsert store hours with generated ID
    const storeHours = await prisma.store_hours.upsert({
      where: { vendorStoreId: store.id },
      create: {
        id: generateId('hours'),
        vendorStoreId: store.id,
        monday: validatedData.monday,
        tuesday: validatedData.tuesday,
        wednesday: validatedData.wednesday,
        thursday: validatedData.thursday,
        friday: validatedData.friday,
        saturday: validatedData.saturday,
        sunday: validatedData.sunday,
        timezone: validatedData.timezone,
        isEnabled: validatedData.isEnabled,
      },
      update: {
        monday: validatedData.monday,
        tuesday: validatedData.tuesday,
        wednesday: validatedData.wednesday,
        thursday: validatedData.thursday,
        friday: validatedData.friday,
        saturday: validatedData.saturday,
        sunday: validatedData.sunday,
        timezone: validatedData.timezone,
        isEnabled: validatedData.isEnabled,
      },
    })

    return successResponse({
      message: 'Store hours updated successfully',
      storeHours,
    })
  } catch (error: any) {
    return handleApiError(error, 'Update store hours')
  }
}
