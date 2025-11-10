import { NextRequest } from "next/server"
import prisma from "@/lib/db"
import {
  requireAdmin,
  handleApiError,
  successResponse,
} from "@/lib/utils/api"

// GET /api/admin/stores - Fetch all stores with related data
export async function GET(_request: NextRequest) {
  try {
    await requireAdmin()

    // Fetch all stores with owner info and counts
    const stores = await prisma.vendor_stores.findMany({
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
            products: true,
            store_orders: true,
          },
        },
      },
    })

    return successResponse({
      stores,
      total: stores.length,
    })
  } catch (error) {
    return handleApiError(error, 'Fetch stores (admin)')
  }
}
