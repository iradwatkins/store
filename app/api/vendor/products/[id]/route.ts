import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = session.user.role === "ADMIN"

    // Admins can view any product, vendors can only view their own
    let product
    if (isAdmin) {
      product = await prisma.product.findUnique({
        where: {
          id: params.id,
        },
        include: {
          images: {
            orderBy: {
              sortOrder: "asc",
            },
          },
          variants: {
            orderBy: {
              createdAt: "asc",
            },
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
            },
          },
        },
      })
    } else {
      const store = await prisma.vendorStore.findFirst({
        where: {
          userId: session.user.id,
        },
      })

      if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 })
      }

      product = await prisma.product.findFirst({
        where: {
          id: params.id,
          vendorStoreId: store.id,
        },
        include: {
          images: {
            orderBy: {
              sortOrder: "asc",
            },
          },
          variants: {
            orderBy: {
              createdAt: "asc",
            },
          },
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      })
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Get product error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = session.user.role === "ADMIN"

    // Admins can update any product, vendors can only update their own
    if (!isAdmin) {
      const store = await prisma.vendorStore.findFirst({
        where: {
          userId: session.user.id,
        },
      })

      if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 })
      }

      const product = await prisma.product.findFirst({
        where: {
          id: params.id,
          vendorStoreId: store.id,
        },
      })

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }
    } else {
      // Admin: Just verify product exists
      const product = await prisma.product.findUnique({
        where: { id: params.id },
      })

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }
    }

    const body = await request.json()

    // Update product
    const updatedProduct = await prisma.product.update({
      where: {
        id: params.id,
      },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        subcategory: body.subcategory || null,
        price: parseFloat(body.price),
        compareAtPrice: body.compareAtPrice ? parseFloat(body.compareAtPrice) : null,
        sku: body.sku,
        trackInventory: body.trackInventory,
        quantity: body.inventoryQuantity ? parseInt(body.inventoryQuantity) : 0,
        status: body.status,
      },
    })

    return NextResponse.json({
      message: "Product updated successfully",
      product: updatedProduct,
    })
  } catch (error) {
    console.error("Update product error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = session.user.role === "ADMIN"

    // Admins can delete any product, vendors can only delete their own
    let store
    let product

    if (!isAdmin) {
      store = await prisma.vendorStore.findFirst({
        where: {
          userId: session.user.id,
        },
      })

      if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 })
      }

      product = await prisma.product.findFirst({
        where: {
          id: params.id,
          vendorStoreId: store.id,
        },
      })

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }
    } else {
      // Admin: Get product and its store
      product = await prisma.product.findUnique({
        where: { id: params.id },
        include: {
          vendorStore: true,
        },
      })

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }

      store = product.vendorStore
    }

    // Delete product (cascades to variants and images)
    await prisma.product.delete({
      where: {
        id: params.id,
      },
    })

    // Decrement product count for tenant (if applicable)
    if (store.tenantId) {
      await prisma.tenant.update({
        where: { id: store.tenantId },
        data: { currentProducts: { decrement: 1 } },
      })
    }

    return NextResponse.json({
      message: "Product deleted successfully",
    })
  } catch (error) {
    console.error("Delete product error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
