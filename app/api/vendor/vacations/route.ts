/**
 * Store Vacations API
 *
 * GET /api/vendor/vacations - List all vacations
 * POST /api/vendor/vacations - Create new vacation
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

const createVacationSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  message: z.string().optional(),
  isActive: z.boolean().default(true),
})

/**
 * GET - Fetch all vacations
 */
export async function GET(req: NextRequest) {
  try {
    // Auth check
    const session = await requireAuth()
    const store = await requireVendorStore(session.user.id)

    // Fetch vacations
    const vacations = await prisma.store_vacations.findMany({
      where: { vendorStoreId: store.id },
      orderBy: { startDate: 'desc' },
    })

    return successResponse({
      vacations,
      total: vacations.length,
    })
  } catch (error: any) {
    return handleApiError(error, 'Fetch vacations')
  }
}

/**
 * POST - Create a new vacation period
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await requireAuth()
    const store = await requireVendorStore(session.user.id)

    // Parse and validate request body
    const body = await req.json()
    const validatedData = createVacationSchema.parse(body)

    // Validate dates
    const startDate = new Date(validatedData.startDate)
    const endDate = new Date(validatedData.endDate)

    if (endDate < startDate) {
      throw new BusinessLogicError('End date must be after start date')
    }

    // Create vacation with generated ID
    const vacation = await prisma.store_vacations.create({
      data: {
        id: idGenerators.vacation(),
        vendorStoreId: store.id,
        startDate,
        endDate,
        message: validatedData.message,
        isActive: validatedData.isActive,
      },
    })

    return successResponse(
      {
        message: 'Vacation period created successfully',
        vacation,
      },
      201
    )
  } catch (error: any) {
    return handleApiError(error, 'Create vacation')
  }
}
