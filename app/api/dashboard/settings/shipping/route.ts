import { z } from "zod"
import prisma from "@/lib/db"
import {
  requireAuth,
  requireVendorStore,
  handleApiError,
  successResponse,
} from "@/lib/utils/api"
import { logger } from "@/lib/logger"

const shippingSettingsSchema = z.object({
  flatRate: z.number().min(0).nullable(),
  freeShippingThreshold: z.number().min(0).nullable(),
  localPickupEnabled: z.boolean(),
})

export async function GET(_request: Request) {
  try {
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    // Get shipping rates
    const store = await prisma.vendor_stores.findUnique({
      where: { id: vendorStore.id },
      select: { shipping_rates: true },
    })

    // Parse shipping rates from JSON field (default to empty object)
    const shippingRates = (store?.shippingRates as any) || {}

    const settings = {
      flatRate: shippingRates.flatRate ?? null,
      freeShippingThreshold: shippingRates.freeShippingThreshold ?? null,
      localPickupEnabled: shippingRates.localPickupEnabled ?? false,
    }

    return successResponse({ settings })
  } catch (error) {
    return handleApiError(error, 'Fetch shipping settings')
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    // Parse and validate request body
    const body = await request.json()
    const validatedData = shippingSettingsSchema.parse(body)

    // Update vendor store shipping rates
    await prisma.vendor_stores.update({
      where: {
        id: vendorStore.id,
      },
      data: {
        shipping_rates: validatedData as any,
      },
    })

    // Log for debugging
    logger.info(`Shipping settings updated for store ${vendorStore.id} by user ${session.user.id}`)

    return successResponse({
      message: "Shipping settings updated successfully",
      settings: validatedData,
    })
  } catch (error) {
    return handleApiError(error, 'Update shipping settings')
  }
}
