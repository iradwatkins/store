import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""
    const type = searchParams.get("type") || "all" // all, products, stores
    const category = searchParams.get("category")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const sortBy = searchParams.get("sortBy") || "relevance" // relevance, price_asc, price_desc, newest

    if (!query.trim()) {
      return NextResponse.json({
        products: [],
        stores: [],
        total: 0,
      })
    }

    const searchQuery = query.trim()
    const results: {
      products: any[]
      stores: any[]
      total: number
    } = {
      products: [],
      stores: [],
      total: 0,
    }

    // Search products
    if (type === "all" || type === "products") {
      const productWhere: any = {
        status: "ACTIVE",
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { description: { contains: searchQuery, mode: "insensitive" } },
        ],
      }

      // Apply filters
      if (category) {
        productWhere.category = category
      }

      if (minPrice || maxPrice) {
        productWhere.price = {}
        if (minPrice) productWhere.price.gte = parseFloat(minPrice)
        if (maxPrice) productWhere.price.lte = parseFloat(maxPrice)
      }

      // Determine sort order
      let orderBy: any = { createdAt: "desc" }
      if (sortBy === "price_asc") orderBy = { price: "asc" }
      if (sortBy === "price_desc") orderBy = { price: "desc" }
      if (sortBy === "newest") orderBy = { createdAt: "desc" }

      const products = await prisma.product.findMany({
        where: productWhere,
        take: 50,
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

      results.products = products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: Number(product.price),
        category: product.category,
        image: product.images[0]?.medium || product.images[0]?.url || null,
        storeName: product.vendorStore.name,
        storeSlug: product.vendorStore.slug,
        quantity: product.quantity,
      }))
    }

    // Search stores
    if (type === "all" || type === "stores") {
      const stores = await prisma.vendorStore.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { description: { contains: searchQuery, mode: "insensitive" } },
          ],
        },
        take: 20,
        include: {
          _count: {
            select: {
              Product: {
                where: {
                  status: "ACTIVE",
                },
              },
            },
          },
        },
      })

      results.stores = stores.map((store) => ({
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        logoUrl: store.logoUrl,
        productCount: store._count.Product,
      }))
    }

    results.total = results.products.length + results.stores.length

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    )
  }
}
