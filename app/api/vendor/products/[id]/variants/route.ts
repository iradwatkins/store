import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

const createVariantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  value: z.string().min(1, "Variant value is required"),
  price: z.number().optional().nullable(),
  sku: z.string().optional().nullable(),
  quantity: z.number().int().min(0, "Quantity must be non-negative"),
  available: z.boolean().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = session.user.role === "ADMIN"

    // Verify product ownership
    let product
    if (isAdmin) {
      product = await prisma.product.findUnique({
        where: { id: params.id },
        include: { variants: true },
      })
    } else {
      const store = await prisma.vendorStore.findFirst({
        where: { userId: session.user.id },
      })

      if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 })
      }

      product = await prisma.product.findFirst({
        where: {
          id: params.id,
          vendorStoreId: store.id,
        },
        include: { variants: true },
      })
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = createVariantSchema.parse(body)

    // Get max sortOrder
    const maxSortOrder = product.variants.length > 0
      ? Math.max(...product.variants.map((v: any) => v.sortOrder))
      : -1

    // Create variant
    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        name: validatedData.name,
        value: validatedData.value,
        price: validatedData.price,
        sku: validatedData.sku,
        quantity: validatedData.quantity,
        available: validatedData.available !== undefined ? validatedData.available : true,
        sortOrder: maxSortOrder + 1,
      },
    })

    // Update product hasVariants flag if this is the first variant
    if (product.variants.length === 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: { hasVariants: true },
      })
    }

    logger.info(`${isAdmin ? 'Admin' : 'Vendor'} added variant to product: ${product.name}`)

    return NextResponse.json(
      {
        message: "Variant created successfully",
        variant,
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error("Create variant error:", error)

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
