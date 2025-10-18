// Stripe Price ID mapping
export const STRIPE_PRICES = {
  STARTER: process.env.STRIPE_PRICE_STARTER || "",
  PRO: process.env.STRIPE_PRICE_PRO || "",
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE || "",
} as const

export type PlanId = keyof typeof STRIPE_PRICES

export function getPriceId(planId: PlanId): string {
  return STRIPE_PRICES[planId]
}
