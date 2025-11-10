import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

/**
 * Initialize stock fields for a product or variant
 * Sets quantityAvailable = quantity, onHold = 0, committed = 0
 */
export async function initializeStock(
  productId: string,
  variantId?: string,
  variantCombinationId?: string
): Promise<void> {
  try {
    // Use variantCombinationId (new system) first, then variantId (old system)
    const effectiveVariantId = variantCombinationId || variantId

    if (effectiveVariantId) {
      // Update variant combination
      const variant = await prisma.variant_combinations.findUnique({
        where: { id: effectiveVariantId },
      })

      if (variant) {
        await prisma.variant_combinations.update({
          where: { id: effectiveVariantId },
          data: {
            quantityAvailable: variant.quantity,
            quantityOnHold: 0,
            quantityCommitted: 0,
          },
        })
      }
    } else {
      // Update product
      const product = await prisma.products.findUnique({
        where: { id: productId },
      })

      if (product) {
        await prisma.products.update({
          where: { id: productId },
          data: {
            quantityAvailable: product.quantity,
            quantityOnHold: 0,
            quantityCommitted: 0,
          },
        })
      }
    }
  } catch (error) {
    logger.error("Error initializing stock:", error)
    throw error
  }
}

/**
 * Reserve stock when an order is created (PENDING status)
 * Moves stock from available to onHold
 */
export async function reserveStock(
  productId: string,
  quantity: number,
  variantId?: string,
  variantCombinationId?: string
): Promise<boolean> {
  try {
    // Use variantCombinationId (new system) first, then variantId (old system)
    const effectiveVariantId = variantCombinationId || variantId

    if (effectiveVariantId) {
      // Check and reserve variant stock
      const variant = await prisma.variant_combinations.findUnique({
        where: { id: effectiveVariantId },
      })

      if (!variant || !variant.inventoryTracked) {
        return true // No tracking needed
      }

      const available = variant.quantityAvailable ?? variant.quantity

      if (available < quantity) {
        return false // Insufficient stock
      }

      await prisma.variant_combinations.update({
        where: { id: effectiveVariantId },
        data: {
          quantityAvailable: { decrement: quantity },
          quantityOnHold: { increment: quantity },
        },
      })
    } else {
      // Check and reserve product stock
      const product = await prisma.products.findUnique({
        where: { id: productId },
      })

      if (!product || !product.trackInventory) {
        return true // No tracking needed
      }

      const available = product.quantityAvailable ?? product.quantity

      if (available < quantity) {
        return false // Insufficient stock
      }

      await prisma.products.update({
        where: { id: productId },
        data: {
          quantityAvailable: { decrement: quantity },
          quantityOnHold: { increment: quantity },
        },
      })
    }

    return true
  } catch (error) {
    logger.error("Error reserving stock:", error)
    return false
  }
}

/**
 * Commit stock when an order is fulfilled/shipped
 * Moves stock from onHold to committed
 */
export async function commitStock(
  productId: string,
  quantity: number,
  variantId?: string,
  variantCombinationId?: string
): Promise<void> {
  try {
    // Use variantCombinationId (new system) first, then variantId (old system)
    const effectiveVariantId = variantCombinationId || variantId

    if (effectiveVariantId) {
      await prisma.variant_combinations.update({
        where: { id: effectiveVariantId },
        data: {
          quantityOnHold: { decrement: quantity },
          quantityCommitted: { increment: quantity },
        },
      })
    } else {
      await prisma.products.update({
        where: { id: productId },
        data: {
          quantityOnHold: { decrement: quantity },
          quantityCommitted: { increment: quantity },
        },
      })
    }
  } catch (error) {
    logger.error("Error committing stock:", error)
    throw error
  }
}

/**
 * Release stock when an order is cancelled/refunded
 * Moves stock from onHold back to available
 */
export async function releaseStock(
  productId: string,
  quantity: number,
  variantId?: string,
  variantCombinationId?: string
): Promise<void> {
  try {
    // Use variantCombinationId (new system) first, then variantId (old system)
    const effectiveVariantId = variantCombinationId || variantId

    if (effectiveVariantId) {
      await prisma.variant_combinations.update({
        where: { id: effectiveVariantId },
        data: {
          quantityOnHold: { decrement: quantity },
          quantityAvailable: { increment: quantity },
        },
      })
    } else {
      await prisma.products.update({
        where: { id: productId },
        data: {
          quantityOnHold: { decrement: quantity },
          quantityAvailable: { increment: quantity },
        },
      })
    }
  } catch (error) {
    logger.error("Error releasing stock:", error)
    throw error
  }
}

/**
 * Adjust total stock quantity (for restocking or corrections)
 * Updates quantity and quantityAvailable accordingly
 */
export async function adjustTotalStock(
  productId: string,
  newQuantity: number,
  variantId?: string,
  variantCombinationId?: string
): Promise<void> {
  try {
    // Use variantCombinationId (new system) first, then variantId (old system)
    const effectiveVariantId = variantCombinationId || variantId

    if (effectiveVariantId) {
      const variant = await prisma.variant_combinations.findUnique({
        where: { id: effectiveVariantId },
      })

      if (variant) {
        const onHold = variant.quantityOnHold
        const committed = variant.quantityCommitted
        const available = Math.max(0, newQuantity - onHold - committed)

        await prisma.variant_combinations.update({
          where: { id: effectiveVariantId },
          data: {
            quantity: newQuantity,
            quantityAvailable: available,
            inStock: newQuantity > 0,
            available: available > 0,
          },
        })
      }
    } else {
      const product = await prisma.products.findUnique({
        where: { id: productId },
      })

      if (product) {
        const onHold = product.quantityOnHold
        const committed = product.quantityCommitted
        const available = Math.max(0, newQuantity - onHold - committed)

        await prisma.products.update({
          where: { id: productId },
          data: {
            quantity: newQuantity,
            quantityAvailable: available,
          },
        })
      }
    }
  } catch (error) {
    logger.error("Error adjusting stock:", error)
    throw error
  }
}

/**
 * Check if stock is available for purchase
 */
export async function checkStockAvailability(
  productId: string,
  requestedQuantity: number,
  variantId?: string,
  variantCombinationId?: string
): Promise<{ available: boolean; quantity: number }> {
  try {
    // Use variantCombinationId (new system) first, then variantId (old system)
    const effectiveVariantId = variantCombinationId || variantId

    if (effectiveVariantId) {
      const variant = await prisma.variant_combinations.findUnique({
        where: { id: effectiveVariantId },
      })

      if (!variant || !variant.inventoryTracked) {
        return { available: true, quantity: requestedQuantity }
      }

      const availableQty = variant.quantityAvailable ?? variant.quantity

      return {
        available: availableQty >= requestedQuantity,
        quantity: availableQty,
      }
    } else {
      const product = await prisma.products.findUnique({
        where: { id: productId },
      })

      if (!product || !product.trackInventory) {
        return { available: true, quantity: requestedQuantity }
      }

      const availableQty = product.quantityAvailable ?? product.quantity

      return {
        available: availableQty >= requestedQuantity,
        quantity: availableQty,
      }
    }
  } catch (error) {
    logger.error("Error checking stock availability:", error)
    return { available: false, quantity: 0 }
  }
}

/**
 * Get low stock products for a vendor
 */
export async function getLowStockProducts(vendorStoreId: string) {
  try {
    const products = await prisma.products.findMany({
      where: {
        vendorStoreId,
        trackInventory: true,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        sku: true,
        quantity: true,
        quantityAvailable: true,
        quantityOnHold: true,
        lowStockThreshold: true,
        product_images: {
          take: 1,
          orderBy: { sortOrder: "asc" },
        },
      },
    })

    const lowStock = products.filter((p) => {
      const available = p.quantityAvailable ?? p.quantity
      return available <= p.lowStockThreshold
    })

    return lowStock
  } catch (error) {
    logger.error("Error getting low stock products:", error)
    return []
  }
}
