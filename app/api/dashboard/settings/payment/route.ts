import { NextRequest } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import {
  requireAuth,
  requireVendorStore,
  handleApiError,
  successResponse,
} from "@/lib/utils/api"
import { BusinessLogicError } from "@/lib/errors"

const paymentSettingsSchema = z.object({
  primaryPaymentProcessor: z.enum(["STRIPE", "PAYPAL", "SQUARE", "CASH"]),
  secondaryPaymentProcessor: z.enum(["STRIPE", "PAYPAL", "SQUARE", "CASH"]).optional(),
  paypalEmail: z.string().email().optional().or(z.literal("")),
  paypalMerchantId: z.string().optional().or(z.literal("")),
  squareAccessToken: z.string().optional().or(z.literal("")),
  squareLocationId: z.string().optional().or(z.literal("")),
  acceptsCash: z.boolean().optional(),
  cashInstructions: z.string().optional().or(z.literal("")),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    const storeSettings = await prisma.vendor_stores.findUnique({
      where: { id: vendorStore.id },
      select: {
        id: true,
        primaryPaymentProcessor: true,
        secondaryPaymentProcessor: true,
        stripeAccountId: true,
        stripeChargesEnabled: true,
        paypalEmail: true,
        paypalMerchantId: true,
        squareAccessToken: true,
        squareLocationId: true,
        acceptsCash: true,
        cashInstructions: true,
      },
    })

    return successResponse(storeSettings)
  } catch (error) {
    return handleApiError(error, 'Fetch payment settings')
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    const body = await request.json()
    const validatedData = paymentSettingsSchema.parse(body)

    // Validate that primary and secondary are different
    if (
      validatedData.secondaryPaymentProcessor &&
      validatedData.primaryPaymentProcessor === validatedData.secondaryPaymentProcessor
    ) {
      throw new BusinessLogicError("Primary and secondary payment methods must be different")
    }

    // Update payment settings
    const updated = await prisma.vendor_stores.update({
      where: { id: vendorStore.id },
      data: {
        primaryPaymentProcessor: validatedData.primaryPaymentProcessor,
        secondaryPaymentProcessor: validatedData.secondaryPaymentProcessor || null,
        paypalEmail: validatedData.paypalEmail || null,
        paypalMerchantId: validatedData.paypalMerchantId || null,
        squareAccessToken: validatedData.squareAccessToken || null,
        squareLocationId: validatedData.squareLocationId || null,
        acceptsCash: validatedData.acceptsCash || false,
        cashInstructions: validatedData.cashInstructions || null,
      },
      select: {
        id: true,
        primaryPaymentProcessor: true,
        secondaryPaymentProcessor: true,
        paypalEmail: true,
        paypalMerchantId: true,
        squareAccessToken: true,
        squareLocationId: true,
        acceptsCash: true,
        cashInstructions: true,
      },
    })

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Update payment settings')
  }
}
