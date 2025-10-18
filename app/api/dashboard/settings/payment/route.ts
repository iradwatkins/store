import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

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
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const vendorStore = await prisma.vendorStore.findFirst({
      where: { userId: session.user.id },
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

    if (!vendorStore) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    return NextResponse.json(vendorStore)
  } catch (error) {
    console.error("Error fetching payment settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch payment settings" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = paymentSettingsSchema.parse(body)

    // Validate that primary and secondary are different
    if (
      validatedData.secondaryPaymentProcessor &&
      validatedData.primaryPaymentProcessor === validatedData.secondaryPaymentProcessor
    ) {
      return NextResponse.json(
        { error: "Primary and secondary payment methods must be different" },
        { status: 400 }
      )
    }

    // Get vendor store
    const vendorStore = await prisma.vendorStore.findFirst({
      where: { userId: session.user.id },
    })

    if (!vendorStore) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    // Update payment settings
    const updated = await prisma.vendorStore.update({
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

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating payment settings:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update payment settings" },
      { status: 500 }
    )
  }
}
