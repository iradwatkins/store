import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const priceRange = searchParams.get("priceRange")
    const sort = searchParams.get("sort") || "newest"

    // Build where clause
    const where: any = {
      status: "ACTIVE",
      quantity: {
        gt: 0,
      },
    }

    // Add category filter
    if (category) {
      where.category = category
    }

    // Add price range filter
    if (priceRange) {
      const [min, max] = priceRange.split("-").map((v) => (v ? parseFloat(v) : null))
      where.price = {}
      if (min !== null) where.price.gte = min
      if (max !== null) where.price.lte = max
    }

    // Determine sort order
    let orderBy: any = { createdAt: "desc" }
    if (sort === "price_asc") orderBy = { price: "asc" }
    if (sort === "price_desc") orderBy = { price: "desc" }
    if (sort === "newest") orderBy = { createdAt: "desc" }

    // Fetch products
    const products = await prisma.product.findMany({
      where,
      take: 100,
      orderBy,
      include: {
        images: {
          take: 1,
        },
        vendorStore: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    })

    // Format response
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      category: product.category,
      image: product.images[0]?.medium || product.images[0]?.url || null,
      storeName: product.vendorStore.name,
      storeSlug: product.vendorStore.slug,
    }))

    return NextResponse.json({ products: formattedProducts })
  } catch (error) {
    logger.error("Filter error:", error)
    return NextResponse.json(
      { error: "Failed to filter products" },
      { status: 500 }
    )
  }
}
