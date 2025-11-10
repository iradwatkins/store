import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")

    if (!slug) {
      return NextResponse.json({ error: "Store slug is required" }, { status: 400 })
    }

    const store = await prisma.vendor_stores.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        acceptsCash: true,
        cashInstructions: true,
        stripeAccountId: true,
      },
    })

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    return NextResponse.json({
      acceptsCash: store.acceptsCash || false,
      cashInstructions: store.cashInstructions || "",
      hasStripe: !!store.stripeAccountId,
    })
  } catch (error) {
    logger.error("Error fetching store settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
