import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"

// DELETE /api/admin/stores/[storeId] - Delete a store and all related data
export async function DELETE(
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
      include: {
        User: {
          select: {
            id: true,
            email: true,
          },
        },
        _count: {
          select: {
            Product: true,
            StoreOrder: true,
          },
        },
      },
    })

    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      )
    }

    // CASCADE DELETION ORDER:
    // 1. Reviews (dependent on order items and products)
    // 2. Order items (dependent on orders and products)
    // 3. Orders
    // 4. Variants (dependent on products)
    // 5. Images (dependent on products)
    // 6. Products
    // 7. Shop ratings
    // 8. Store itself

    console.log(`Starting deletion of store: ${store.name} (${store.id})`)
    console.log(`Store has ${store._count.Product} products and ${store._count.StoreOrder} orders`)

    // Delete all reviews for products in this store
    await prisma.productReview.deleteMany({
      where: { vendorStoreId: storeId },
    })
    console.log("Deleted product reviews")

    // Delete all order items for orders in this store
    const orderIds = await prisma.storeOrder.findMany({
      where: { vendorStoreId: storeId },
      select: { id: true },
    })

    if (orderIds.length > 0) {
      await prisma.storeOrderItem.deleteMany({
        where: {
          storeOrderId: { in: orderIds.map((o) => o.id) },
        },
      })
      console.log("Deleted order items")
    }

    // Delete all orders
    await prisma.storeOrder.deleteMany({
      where: { vendorStoreId: storeId },
    })
    console.log("Deleted orders")

    // Get all products to delete their related data
    const productIds = await prisma.product.findMany({
      where: { vendorStoreId: storeId },
      select: { id: true },
    })

    if (productIds.length > 0) {
      // Delete product variants
      await prisma.productVariant.deleteMany({
        where: {
          productId: { in: productIds.map((p) => p.id) },
        },
      })
      console.log("Deleted product variants")

      // Delete product images
      await prisma.productImage.deleteMany({
        where: {
          productId: { in: productIds.map((p) => p.id) },
        },
      })
      console.log("Deleted product images")

      // Delete products
      await prisma.product.deleteMany({
        where: { vendorStoreId: storeId },
      })
      console.log("Deleted products")
    }

    // Delete shop rating
    await prisma.shopRating.deleteMany({
      where: { vendorStoreId: storeId },
    })
    console.log("Deleted shop rating")

    // Delete the store
    await prisma.vendorStore.delete({
      where: { id: storeId },
    })
    console.log("Deleted store")

    // Check if user has any other stores
    const userStoreCount = await prisma.vendorStore.count({
      where: { userId: store.User.id },
    })

    // If user has no more stores, downgrade their role from STORE_OWNER to USER
    if (userStoreCount === 0 && store.User) {
      const user = await prisma.user.findUnique({
        where: { id: store.User.id },
        select: { role: true },
      })

      if (user?.role === "STORE_OWNER") {
        await prisma.user.update({
          where: { id: store.User.id },
          data: { role: "USER" },
        })
        console.log(`Downgraded user ${store.User.email} from STORE_OWNER to USER`)
      }
    }

    return NextResponse.json({
      message: "Store and all related data deleted successfully",
      deletedStore: {
        id: store.id,
        name: store.name,
        productsDeleted: store._count.Product,
        ordersDeleted: store._count.StoreOrder,
      },
    })
  } catch (error) {
    console.error("Admin delete store error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
