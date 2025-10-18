import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get vendor store
    const vendorStore = await prisma.vendorStore.findFirst({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    })

    if (!vendorStore) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "all"

    // Build where clause based on filter
    const where: any = {
      vendorStoreId: vendorStore.id,
    }

    if (filter === "flagged") {
      where.status = "FLAGGED"
    } else {
      where.status = "PUBLISHED"

      if (filter === "needResponse") {
        where.vendorResponse = null
      } else if (filter === "responded") {
        where.vendorResponse = {
          not: null,
        }
      }
    }

    // Fetch reviews
    const reviews = await prisma.productReview.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}
