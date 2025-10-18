import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"
import { logger } from "@/lib/logger"

const updateProductSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().min(20).optional(),
  category: z.string().optional(),
  subcategory: z.string().nullish(),
  price: z.number().optional(),
  compareAtPrice: z.number().nullish(),
  sku: z.string().nullish(),
  trackInventory: z.boolean().optional(),
  quantity: z.number().int().min(0).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "OUT_OF_STOCK", "ARCHIVED"]).optional(),
})

// GET /api/admin/products/[productId] - Get a single product
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
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

    const { productId } = params

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
        variants: {
          orderBy: { createdAt: "asc" },
        },
        vendorStore: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
            reviews: true,
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

    return NextResponse.json({ product })
  } catch (error) {
    logger.error("Admin get product error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/products/[productId] - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string } }
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

    const { productId } = params

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendorStore: {
          select: {
            id: true,
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

    const body = await request.json()
    const validatedData = updateProductSchema.parse(body)

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: validatedData,
    })

    logger.info(`Admin updated product: ${updatedProduct.name} (${updatedProduct.id})`)

    return NextResponse.json({
      message: "Product updated successfully",
      product: updatedProduct,
    })
  } catch (error) {
    logger.error("Admin update product error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/products/[productId] - Toggle product status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { productId: string } }
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

    const { productId } = params

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { status } = body

    if (!status || !["DRAFT", "ACTIVE", "OUT_OF_STOCK", "ARCHIVED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be DRAFT, ACTIVE, OUT_OF_STOCK, or ARCHIVED" },
        { status: 400 }
      )
    }

    // Update product status
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { status },
    })

    logger.info(`Admin changed product status: ${updatedProduct.name} → ${status}`)

    return NextResponse.json({
      message: `Product status changed to ${status}`,
      product: updatedProduct,
    })
  } catch (error) {
    logger.error("Admin update product status error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/[productId] - Delete a product and all related data
export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
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

    const { productId } = params

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendorStore: {
          select: {
            id: true,
            name: true,
            tenantId: true,
          },
        },
        _count: {
          select: {
            variants: true,
            images: true,
            reviews: true,
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

    logger.info(`Starting deletion of product: ${product.name} (${product.id})`)
    logger.info(`Product has ${product._count.variants} variants, ${product._count.images} images, ${product._count.reviews} reviews`)

    // CASCADE DELETION ORDER:
    // 1. Reviews (dependent on product and order items)
    // 2. Order items (dependent on product)
    // 3. Variants (dependent on product)
    // 4. Images (dependent on product)
    // 5. Product itself

    // Delete reviews for this product
    await prisma.productReview.deleteMany({
      where: { productId: productId },
    })
    logger.info("Deleted product reviews")

    // Delete order items (but not the orders themselves)
    await prisma.storeOrderItem.deleteMany({
      where: { productId: productId },
    })
    logger.info("Deleted order items")

    // Delete product variants
    await prisma.productVariant.deleteMany({
      where: { productId: productId },
    })
    logger.info("Deleted product variants")

    // Delete product images
    await prisma.productImage.deleteMany({
      where: { productId: productId },
    })
    logger.info("Deleted product images")

    // Delete the product
    await prisma.product.delete({
      where: { id: productId },
    })
    logger.info("Deleted product")

    // Decrement product count for tenant (if applicable)
    if (product.vendorStore.tenantId) {
      await prisma.tenant.update({
        where: { id: product.vendorStore.tenantId },
        data: { currentProducts: { decrement: 1 } },
      })
      logger.info("Decremented tenant product count")
    }

    return NextResponse.json({
      message: "Product and all related data deleted successfully",
      deletedProduct: {
        id: product.id,
        name: product.name,
        storeName: product.vendorStore.name,
        variantsDeleted: product._count.variants,
        imagesDeleted: product._count.images,
        reviewsDeleted: product._count.reviews,
      },
    })
  } catch (error) {
    logger.error("Admin delete product error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
