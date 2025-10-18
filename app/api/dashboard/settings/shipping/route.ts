import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

const shippingSettingsSchema = z.object({
  flatRate: z.number().min(0).nullable(),
  freeShippingThreshold: z.number().min(0).nullable(),
  localPickupEnabled: z.boolean(),
})

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get vendor store for this user
    const vendorStore = await prisma.vendorStore.findFirst({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        shippingRates: true,
      },
    })

    if (!vendorStore) {
      return NextResponse.json({ error: "Vendor store not found" }, { status: 404 })
    }

    // Parse shipping rates from JSON field (default to empty object)
    const shippingRates = (vendorStore.shippingRates as any) || {}

    const settings = {
      flatRate: shippingRates.flatRate ?? null,
      freeShippingThreshold: shippingRates.freeShippingThreshold ?? null,
      localPickupEnabled: shippingRates.localPickupEnabled ?? false,
    }

    return NextResponse.json({ settings })
  } catch (error) {
    logger.error("Error fetching shipping settings:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch shipping settings",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get vendor store for this user
    const vendorStore = await prisma.vendorStore.findFirst({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    })

    if (!vendorStore) {
      return NextResponse.json({ error: "Vendor store not found" }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = shippingSettingsSchema.parse(body)

    // Update vendor store shipping rates
    await prisma.vendorStore.update({
      where: {
        id: vendorStore.id,
      },
      data: {
        shippingRates: validatedData as any,
      },
    })

    // Log for debugging
    logger.info(`Shipping settings updated for store ${vendorStore.id} by user ${session.user.id}`)

    return NextResponse.json({
      message: "Shipping settings updated successfully",
      settings: validatedData,
    })
  } catch (error) {
    logger.error("Error updating shipping settings:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid shipping settings data",
          details: error.issues,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update shipping settings",
      },
      { status: 500 }
    )
  }
}
