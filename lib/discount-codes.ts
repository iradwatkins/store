/**
 * Discount code generation and validation for abandoned cart recovery
 */

/**
 * Generate a unique recovery discount code
 */
export function generateRecoveryCode(): string {
  const prefix = "RECOVER"
  const random = Math.random().toString(36).substr(2, 8).toUpperCase()
  return `${prefix}${random}`
}

/**
 * Calculate discount amount from cart total
 */
export function calculateDiscountAmount(
  cartTotal: number,
  discountPercent: number
): number {
  return Number((cartTotal * (discountPercent / 100)).toFixed(2))
}

/**
 * Apply recovery discount to cart total
 */
export function applyRecoveryDiscount(
  cartTotal: number,
  discountPercent: number
): { discountAmount: number; finalTotal: number } {
  const discountAmount = calculateDiscountAmount(cartTotal, discountPercent)
  const finalTotal = Number((cartTotal - discountAmount).toFixed(2))

  return {
    discountAmount,
    finalTotal: finalTotal < 0 ? 0 : finalTotal,
  }
}
