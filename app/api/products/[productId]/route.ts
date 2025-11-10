import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params

    const product = await prisma.products.findUnique({
      where: {
        id: productId,
        status: "ACTIVE",
      },
      include: {
        product_images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        variantCombinations: {
          where: {
            available: true,
          },
        },
        vendor_stores: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // Convert Decimal to number for JSON serialization
    const formattedProduct = {
      ...product,
      price: product.price.toNumber(),
      compareAtPrice: product.compareAtPrice?.toNumber() || null,
      variantCombinations: product.variantCombinations.map((vc) => ({
        ...vc,
        price: vc.price?.toNumber() || 0,
        compareAtPrice: vc.compareAtPrice?.toNumber() || null,
      })),
    }

    return NextResponse.json({
      product: formattedProduct,
    })
  } catch (error) {
    logger.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
