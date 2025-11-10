import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import Decimal from "decimal.js"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number or Decimal as USD currency
 */
export function formatCurrency(amount: number | Decimal | string): string {
  const numericAmount = typeof amount === 'string'
    ? parseFloat(amount)
    : amount instanceof Decimal
    ? amount.toNumber()
    : amount

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numericAmount)
}
