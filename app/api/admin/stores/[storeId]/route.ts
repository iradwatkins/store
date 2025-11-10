import { NextRequest } from "next/server"
import prisma from "@/lib/db"
import {
  requireAdmin,
  handleApiError,
  successResponse,
} from "@/lib/utils/api"
import { NotFoundError } from "@/lib/errors"

// DELETE /api/admin/stores/[storeId] - Delete a store and all related data
export async function DELETE(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    await requireAdmin()

    const { storeId } = params

    // Verify store exists
    const store = await prisma.vendor_stores.findUnique({
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
            products: true,
            store_orders: true,
          },
        },
      },
    })

    if (!store) {
      throw new NotFoundError('Store not found')
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

    // Delete all reviews for products in this store
    await prisma.product_reviews.deleteMany({
      where: { vendorStoreId: storeId },
    })

    // Delete all order items for orders in this store
    const orderIds = await prisma.store_orders.findMany({
      where: { vendorStoreId: storeId },
      select: { id: true },
    })

    if (orderIds.length > 0) {
      await prisma.store_order_items.deleteMany({
        where: {
          storeOrderId: { in: orderIds.map((o) => o.id) },
        },
      })
    }

    // Delete all orders
    await prisma.store_orders.deleteMany({
      where: { vendorStoreId: storeId },
    })

    // Get all products to delete their related data
    const productIds = await prisma.products.findMany({
      where: { vendorStoreId: storeId },
      select: { id: true },
    })

    if (productIds.length > 0) {
      // Delete product variants
      await prisma.product_variants.deleteMany({
        where: {
          productId: { in: productIds.map((p) => p.id) },
        },
      })

      // Delete product images
      await prisma.product_images.deleteMany({
        where: {
          productId: { in: productIds.map((p) => p.id) },
        },
      })

      // Delete products
      await prisma.products.deleteMany({
        where: { vendorStoreId: storeId },
      })
    }

    // Delete shop rating
    await prisma.shop_ratings.deleteMany({
      where: { vendorStoreId: storeId },
    })

    // Delete the store
    await prisma.vendor_stores.delete({
      where: { id: storeId },
    })

    // Check if user has any other stores
    const userStoreCount = await prisma.vendor_stores.count({
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
      }
    }

    return successResponse({
      message: "Store and all related data deleted successfully",
      deletedStore: {
        id: store.id,
        name: store.name,
        productsDeleted: store._count.products,
        ordersDeleted: store._count.store_orders,
      },
    })
  } catch (error) {
    return handleApiError(error, 'Delete store (admin)')
  }
}
