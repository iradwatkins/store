import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

export interface CouponValidationResult {
  valid: boolean
  error?: string
  discountAmount?: number
  coupon?: any
}

export interface CartItem {
  productId: string
  variantId?: string
  price: number
  quantity: number
  category?: string
}

export interface CouponApplicationContext {
  couponCode: string
  vendorStoreId: string
  cartItems: CartItem[]
  subtotal: number
  shippingCost: number
  customerId?: string
  customerEmail?: string
}

/**
 * Validate and calculate discount for a coupon
 */
export async function validateAndCalculateCoupon(
  context: CouponApplicationContext
): Promise<CouponValidationResult> {
  try {
    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: {
        vendorStoreId_code: {
          vendorStoreId: context.vendorStoreId,
          code: context.couponCode.toUpperCase(),
        },
      },
    })

    if (!coupon) {
      return {
        valid: false,
        error: "Coupon code not found",
      }
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return {
        valid: false,
        error: "This coupon is no longer active",
      }
    }

    // Check date validity
    const now = new Date()
    if (coupon.startDate && now < coupon.startDate) {
      return {
        valid: false,
        error: `This coupon is not valid until ${coupon.startDate.toLocaleDateString()}`,
      }
    }

    if (coupon.endDate && now > coupon.endDate) {
      return {
        valid: false,
        error: "This coupon has expired",
      }
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return {
        valid: false,
        error: "This coupon has reached its usage limit",
      }
    }

    // Check per-customer limit
    if (coupon.perCustomerLimit && context.customerId) {
      const customerUsageCount = await prisma.storeOrder.count({
        where: {
          customerId: context.customerId,
          vendorStoreId: context.vendorStoreId,
          // We would need to add a couponId field to StoreOrder to track this properly
          // For now, we'll skip this check
        },
      })
      // TODO: Add couponId to StoreOrder model to properly track per-customer usage
    }

    // Check first-time customer restriction
    if (coupon.firstTimeCustomersOnly && context.customerId) {
      const previousOrders = await prisma.storeOrder.count({
        where: {
          customerId: context.customerId,
          vendorStoreId: context.vendorStoreId,
          paymentStatus: "PAID",
        },
      })

      if (previousOrders > 0) {
        return {
          valid: false,
          error: "This coupon is only valid for first-time customers",
        }
      }
    }

    // Check minimum purchase amount
    if (coupon.minPurchaseAmount && context.subtotal < Number(coupon.minPurchaseAmount)) {
      return {
        valid: false,
        error: `Minimum purchase amount of $${Number(coupon.minPurchaseAmount).toFixed(2)} required`,
      }
    }

    // Check applicable products/categories
    const eligibleItems = context.cartItems.filter((item) => {
      // If excluded products list exists and item is in it, skip
      if (coupon.excludedProducts.length > 0 && coupon.excludedProducts.includes(item.productId)) {
        return false
      }

      // If applicable products list exists, item must be in it
      if (coupon.applicableProducts.length > 0) {
        return coupon.applicableProducts.includes(item.productId)
      }

      // If applicable categories list exists, item category must be in it
      if (coupon.applicableCategories.length > 0 && item.category) {
        return coupon.applicableCategories.includes(item.category)
      }

      // If no restrictions, all items are eligible
      return coupon.applicableProducts.length === 0 && coupon.applicableCategories.length === 0
    })

    if (eligibleItems.length === 0) {
      return {
        valid: false,
        error: "This coupon is not applicable to items in your cart",
      }
    }

    // Calculate discount amount
    const eligibleSubtotal = eligibleItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )

    let discountAmount = 0

    switch (coupon.discountType) {
      case "PERCENTAGE":
        discountAmount = (eligibleSubtotal * Number(coupon.discountValue)) / 100
        break

      case "FIXED_AMOUNT":
        discountAmount = Number(coupon.discountValue)
        break

      case "FREE_SHIPPING":
        discountAmount = context.shippingCost
        break

      default:
        return {
          valid: false,
          error: "Invalid coupon type",
        }
    }

    // Apply maximum discount cap if specified
    if (coupon.maxDiscountAmount && discountAmount > Number(coupon.maxDiscountAmount)) {
      discountAmount = Number(coupon.maxDiscountAmount)
    }

    // Ensure discount doesn't exceed eligible subtotal (except for free shipping)
    if (coupon.discountType !== "FREE_SHIPPING" && discountAmount > eligibleSubtotal) {
      discountAmount = eligibleSubtotal
    }

    return {
      valid: true,
      discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        description: coupon.description,
      },
    }
  } catch (error) {
    logger.error("Error validating coupon:", error)
    return {
      valid: false,
      error: "Failed to validate coupon",
    }
  }
}

/**
 * Increment coupon usage count after successful order
 */
export async function incrementCouponUsage(couponId: string): Promise<void> {
  try {
    await prisma.coupon.update({
      where: { id: couponId },
      data: {
        usageCount: { increment: 1 },
      },
    })
  } catch (error) {
    logger.error("Error incrementing coupon usage:", error)
    throw error
  }
}

/**
 * Get coupon by code for a specific vendor store
 */
export async function getCouponByCode(
  vendorStoreId: string,
  code: string
): Promise<any | null> {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: {
        vendorStoreId_code: {
          vendorStoreId,
          code: code.toUpperCase(),
        },
      },
    })

    return coupon
  } catch (error) {
    logger.error("Error fetching coupon:", error)
    return null
  }
}
