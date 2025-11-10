import { NextRequest } from "next/server"
import prisma from "@/lib/db"
import {
  requireAuth,
  requireVendorStore,
  handleApiError,
  successResponse,
} from "@/lib/utils/api"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

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
    const reviews = await prisma.product_reviews.findMany({
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

    return successResponse({ reviews })
  } catch (error) {
    return handleApiError(error, 'Fetch reviews')
  }
}
