import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

// GET /api/admin/stores - Fetch all stores with related data
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Admin authentication check
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    // Fetch all stores with owner info and counts
    const stores = await prisma.vendorStore.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            Product: true,
            StoreOrder: true,
          },
        },
      },
    })

    return NextResponse.json({
      stores,
      total: stores.length,
    })
  } catch (error) {
    logger.error("Admin get stores error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
