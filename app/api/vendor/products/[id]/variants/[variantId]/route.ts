import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"

const updateVariantSchema = z.object({
  name: z.string().min(1, "Variant name is required").optional(),
  value: z.string().min(1, "Variant value is required").optional(),
  price: z.number().optional().nullable(),
  sku: z.string().optional().nullable(),
  quantity: z.number().int().min(0, "Quantity must be non-negative").optional(),
  available: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = session.user.role === "ADMIN"

    // Verify variant ownership
    const variant = await prisma.productVariant.findUnique({
      where: { id: params.variantId },
      include: {
        product: {
          include: {
            vendorStore: true,
          },
        },
      },
    })

    if (!variant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 })
    }

    // Verify variant belongs to this product
    if (variant.productId !== params.id) {
      return NextResponse.json(
        { error: "Variant does not belong to this product" },
        { status: 400 }
      )
    }

    // Check permission
    if (!isAdmin) {
      if (variant.product.vendorStore.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    const body = await request.json()
    const validatedData = updateVariantSchema.parse(body)

    // Update variant
    const updatedVariant = await prisma.productVariant.update({
      where: { id: params.variantId },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.value !== undefined && { value: validatedData.value }),
        ...(validatedData.price !== undefined && { price: validatedData.price }),
        ...(validatedData.sku !== undefined && { sku: validatedData.sku }),
        ...(validatedData.quantity !== undefined && { quantity: validatedData.quantity }),
        ...(validatedData.available !== undefined && { available: validatedData.available }),
      },
    })

    console.log(`${isAdmin ? 'Admin' : 'Vendor'} updated variant: ${updatedVariant.name}`)

    return NextResponse.json({
      message: "Variant updated successfully",
      variant: updatedVariant,
    })
  } catch (error) {
    console.error("Update variant error:", error)

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = session.user.role === "ADMIN"

    // Verify variant ownership
    const variant = await prisma.productVariant.findUnique({
      where: { id: params.variantId },
      include: {
        product: {
          include: {
            vendorStore: true,
            variants: true,
          },
        },
      },
    })

    if (!variant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 })
    }

    // Verify variant belongs to this product
    if (variant.productId !== params.id) {
      return NextResponse.json(
        { error: "Variant does not belong to this product" },
        { status: 400 }
      )
    }

    // Check permission
    if (!isAdmin) {
      if (variant.product.vendorStore.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    // Delete variant
    await prisma.productVariant.delete({
      where: { id: params.variantId },
    })

    // If this was the last variant, update product hasVariants flag
    if (variant.product.variants.length === 1) {
      await prisma.product.update({
        where: { id: variant.productId },
        data: { hasVariants: false },
      })
    }

    console.log(`${isAdmin ? 'Admin' : 'Vendor'} deleted variant: ${variant.name}`)

    return NextResponse.json({
      message: "Variant deleted successfully",
    })
  } catch (error) {
    console.error("Delete variant error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
