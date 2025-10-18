import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"

// GET /api/admin/stores/[storeId]/products - Fetch all products for a specific store
export async function GET(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const session = await auth()

    // Admin authentication check
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const { storeId } = params

    // Verify store exists
    const store = await prisma.vendorStore.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    })

    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      )
    }

    // Fetch all products for this store
    const products = await prisma.product.findMany({
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

    return NextResponse.json({
      store,
      products,
      total: products.length,
    })
  } catch (error) {
    console.error("Admin get store products error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
