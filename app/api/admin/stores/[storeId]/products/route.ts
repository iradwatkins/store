import { NextRequest } from "next/server"
import prisma from "@/lib/db"
import {
  requireAdmin,
  handleApiError,
  successResponse,
} from "@/lib/utils/api"
import { NotFoundError } from "@/lib/errors"

// GET /api/admin/stores/[storeId]/products - Fetch all products for a specific store
export async function GET(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    await requireAdmin()

    const { storeId } = params

    // Verify store exists
    const store = await prisma.vendor_stores.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    })

    if (!store) {
      throw new NotFoundError('Store not found')
    }

    // Fetch all products for this store
    const products = await prisma.products.findMany({
      where: { vendorStoreId: storeId },
      orderBy: { createdAt: "desc" },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
        variants: {
          select: {
            id: true,
            name: true,
            value: true,
            quantity: true,
            available: true,
          },
        },
        _count: {
          select: {
            images: true,
            variants: true,
            reviews: true,
            orderItems: true,
          },
        },
      },
    })

    return successResponse({
      store,
      products,
      total: products.length,
    })
  } catch (error) {
    return handleApiError(error, 'Fetch store products (admin)')
  }
}
