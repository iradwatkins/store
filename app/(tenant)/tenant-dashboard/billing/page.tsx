import { redirect } from "next/navigation"
import Link from "next/link"
import { getCurrentTenant } from "@/lib/tenant"
import { auth } from "@/lib/auth"
import { getPriceId } from "@/lib/stripe-prices"
import prisma from "@/lib/db"
import SubscribeButton from "./SubscribeButton"
import ChangePlanButton from "./ChangePlanButton"
import CancelSubscriptionButton from "./CancelSubscriptionButton"
import CustomerPortalButton from "./CustomerPortalButton"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const PLANS = [
  {
    id: "STARTER" as const,
    name: "Starter",
    price: 29,
    features: ["50 products", "100 orders/month", "1GB storage", "5% platform fee"],
  },
  {
    id: "PRO" as const,
    name: "Pro",
    price: 79,
    features: ["500 products", "1,000 orders/month", "10GB storage", "3% platform fee"],
    recommended: true,
  },
  {
    id: "ENTERPRISE" as const,
    name: "Enterprise",
    price: 299,
    features: ["Unlimited products", "Unlimited orders", "100GB storage", "2% platform fee"],
  },
]

export default async function BillingPage() {
  const session = await auth()
  const tenant = await getCurrentTenant()

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/tenant-dashboard/billing")
  }

  if (!tenant) {
    redirect("/onboard")
  }

  if (tenant.ownerId !== session.user.id) {
    redirect("/tenant-dashboard")
  }

  const currentPlanIndex = PLANS.findIndex((p) => p.id === tenant.subscriptionPlan)
  const isOnTrial = tenant.subscriptionStatus === "TRIAL"

  // Fetch subscription history
  const subscriptionHistory = await prisma.subscription_history.findMany({
    where: {
      tenantId: tenant.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 12, // Show last 12 months
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/tenant-dashboard"
            className="text-sm font-medium hover:underline mb-4 inline-block"
            style={{ color: tenant.primaryColor }}
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Subscription & Billing</h1>
          <p className="text-gray-600 mt-1">Manage your plan and payment methods</p>
        </div>

        {/* Current Plan */}
        <div className="bg-white rounded-xl shadow mb-8 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{tenant.subscriptionPlan}</p>
              <p className="text-gray-600 mt-1">
                {isOnTrial ? (
                  <>
                    Trial ends on{" "}
                    <span className="font-semibold">
                      {tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toLocaleDateString() : "N/A"}
                    </span>
                  </>
                ) : (
                  <>Status: <span className="font-semibold">{tenant.subscriptionStatus}</span></>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {isOnTrial
                  ? "$0"
                  : `$${PLANS.find((p) => p.id === tenant.subscriptionPlan)?.price || 0}`}
              </p>
              <p className="text-gray-600">{isOnTrial ? "Trial" : "per month"}</p>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {isOnTrial ? "Choose a Plan" : "Upgrade or Change Plan"}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan, index) => {
              const isCurrent = plan.id === tenant.subscriptionPlan && !isOnTrial
              const isUpgrade = index > currentPlanIndex
              const _isDowngrade = index < currentPlanIndex && !isOnTrial

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border-2 p-6 ${
                    isCurrent
                      ? "border-green-500 bg-green-50"
                      : plan.recommended
                      ? "border-blue-500"
                      : "border-gray-200"
                  }`}
                >
                  {plan.recommended && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Recommended
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Current Plan
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-600 ml-1">/month</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full px-4 py-3 bg-gray-300 text-gray-600 rounded-lg font-medium cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : isUpgrade || isOnTrial ? (
                    <SubscribeButton
                      tenantId={tenant.id}
                      planId={plan.id}
                      planName={plan.name}
                      planPrice={plan.price}
                      priceId={getPriceId(plan.id)}
                      primaryColor={tenant.primaryColor || "#10b981"}
                      isUpgrade={isUpgrade}
                      isOnTrial={isOnTrial}
                    />
                  ) : (
                    <ChangePlanButton
                      tenantId={tenant.id}
                      currentPlanId={tenant.subscriptionPlan}
                      newPlanId={plan.id}
                      newPlanName={plan.name}
                      newPlanPrice={plan.price}
                      newPriceId={getPriceId(plan.id)}
                      primaryColor={tenant.primaryColor || "#10b981"}
                      isDowngrade={true}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Payment Method */}
        {!isOnTrial && (
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Card ending in ****</p>
                  <p className="text-sm text-gray-600">Expires 12/2025</p>
                </div>
              </div>
              <CustomerPortalButton
                tenantId={tenant.id}
                primaryColor={tenant.primaryColor || "#10b981"}
              />
            </div>
          </div>
        )}

        {/* Billing History */}
        {!isOnTrial && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Billing History</h2>
            {subscriptionHistory.length > 0 ? (
              <div className="space-y-3">
                {subscriptionHistory.map((record) => {
                  const statusColor =
                    record.status === "paid"
                      ? "text-green-600"
                      : record.status === "pending"
                      ? "text-yellow-600"
                      : "text-red-600"

                  const statusText =
                    record.status === "paid"
                      ? "Paid"
                      : record.status === "pending"
                      ? "Pending"
                      : "Failed"

                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {record.plan} Plan - {new Date(record.billingPeriodStart).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(record.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ${Number(record.amount).toFixed(2)}
                          </p>
                          <span className={`text-xs font-medium ${statusColor}`}>
                            {statusText}
                          </span>
                        </div>
                        {record.stripeInvoiceId && record.status === "paid" && (
                          <Link
                            href={`https://invoice.stripe.com/i/acct_${process.env.STRIPE_ACCOUNT_ID}/${record.stripeInvoiceId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            View Invoice
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No billing history yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Your first invoice will appear here after your trial ends
                </p>
              </div>
            )}
          </div>
        )}

        {/* Cancel */}
        {!isOnTrial && (
          <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-xl">
            <h3 className="text-lg font-bold text-red-900 mb-2">Cancel Subscription</h3>
            <p className="text-sm text-red-700 mb-4">
              Canceling your subscription will downgrade you to the free trial at the end of your billing period.
            </p>
            <CancelSubscriptionButton tenantId={tenant.id} />
          </div>
        )}
      </div>
    </div>
  )
}
