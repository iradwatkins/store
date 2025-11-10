import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { logger } from "@/lib/logger"

const calculateShippingSchema = z.object({
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  cartTotal: z.number().min(0),
})

type ShippingRate = {
  id: string
  name: string
  price: number
  estimatedDays: string
  carrier: string
}

/**
 * POST /api/shipping/calculate
 * Calculate shipping rates based on ZIP code and cart total
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = calculateShippingSchema.parse(body)

    const { zipCode, cartTotal } = validatedData

    // Extract first 3 digits of ZIP for zone calculation
    const zipPrefix = parseInt(zipCode.substring(0, 3))

    // Determine shipping zone based on ZIP code
    // This is a simplified version - in production you'd use a real zone table
    let zone = 1
    if (zipPrefix >= 100 && zipPrefix <= 299) {
      zone = 1 // Northeast
    } else if (zipPrefix >= 300 && zipPrefix <= 399) {
      zone = 2 // Southeast
    } else if (zipPrefix >= 400 && zipPrefix <= 599) {
      zone = 3 // Midwest
    } else if (zipPrefix >= 600 && zipPrefix <= 799) {
      zone = 4 // South/Central
    } else if (zipPrefix >= 800 && zipPrefix <= 999) {
      zone = 5 // West
    }

    // Calculate base shipping rates by zone
    const zoneMultiplier = 1 + (zone - 1) * 0.15

    const rates: ShippingRate[] = []

    // Free shipping for orders over $50
    if (cartTotal >= 50) {
      rates.push({
        id: "free_shipping",
        name: "Free Standard Shipping",
        price: 0,
        estimatedDays: "5-7 business days",
        carrier: "USPS",
      })
    }

    // Standard shipping
    const standardPrice = Math.round(6.99 * zoneMultiplier * 100) / 100
    rates.push({
      id: "standard",
      name: "Standard Shipping",
      price: standardPrice,
      estimatedDays: "5-7 business days",
      carrier: "USPS",
    })

    // Express shipping
    const expressPrice = Math.round(12.99 * zoneMultiplier * 100) / 100
    rates.push({
      id: "express",
      name: "Express Shipping",
      price: expressPrice,
      estimatedDays: "2-3 business days",
      carrier: "FedEx",
    })

    // Priority overnight (for orders over $25)
    if (cartTotal >= 25) {
      const priorityPrice = Math.round(24.99 * zoneMultiplier * 100) / 100
      rates.push({
        id: "priority_overnight",
        name: "Priority Overnight",
        price: priorityPrice,
        estimatedDays: "1 business day",
        carrier: "FedEx",
      })
    }

    // Local pickup (always available)
    rates.push({
      id: "local_pickup",
      name: "Local Pickup",
      price: 0,
      estimatedDays: "Available tomorrow",
      carrier: "In-Store",
    })

    return NextResponse.json({
      success: true,
      rates,
      zone,
      freeShippingEligible: cartTotal >= 50,
    })
  } catch (error) {
    logger.error("Error calculating shipping:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to calculate shipping rates" },
      { status: 500 }
    )
  }
}
