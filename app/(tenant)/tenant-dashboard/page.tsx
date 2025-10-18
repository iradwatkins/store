import { getCurrentTenant } from "@/lib/tenant"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/db"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function TenantDashboardPage() {
  const session = await auth()
  const tenant = await getCurrentTenant()

  // Redirect if not authenticated
  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/tenant-dashboard")
  }

  // Redirect if no tenant (on main domain)
  if (!tenant) {
    redirect("/onboard")
  }

  // Check if user is tenant owner
  const isOwner = tenant.ownerId === session.user.id

  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this tenant's dashboard.</p>
        </div>
      </div>
    )
  }

  // Fetch tenant statistics
  const stats = await prisma.tenant.findUnique({
    where: { id: tenant.id },
    select: {
      currentProducts: true,
      maxProducts: true,
      currentOrders: true,
      maxOrders: true,
      currentStorageGB: true,
      maxStorageGB: true,
      platformFeePercent: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      vendorStores: {
        select: {
          id: true,
          name: true,
          totalSales: true,
          totalOrders: true,
        },
      },
    },
  })

  // Calculate usage percentages
  const productUsagePercent = stats ? (stats.currentProducts / stats.maxProducts) * 100 : 0
  const orderUsagePercent = stats ? (stats.currentOrders / stats.maxOrders) * 100 : 0
  const storageUsagePercent = stats
    ? (parseFloat(stats.currentStorageGB.toString()) / parseFloat(stats.maxStorageGB.toString())) * 100
    : 0

  // Check if trial is ending soon
  const isTrialEndingSoon = stats?.trialEndsAt
    ? new Date(stats.trialEndsAt).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000
    : false

  const daysUntilTrialEnds = stats?.trialEndsAt
    ? Math.ceil((new Date(stats.trialEndsAt).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))
    : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{tenant.name} Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                <span className="font-mono text-sm">{tenant.slug}.stepperslife.com</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: tenant.primaryColor }}
              >
                {stats?.subscriptionPlan}
              </span>
              <span
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  stats?.subscriptionStatus === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : stats?.subscriptionStatus === "TRIAL"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {stats?.subscriptionStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Trial Warning */}
        {stats?.subscriptionStatus === "TRIAL" && isTrialEndingSoon && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Trial ending in {daysUntilTrialEnds} days!</strong> Upgrade to a paid plan to continue using the platform.
                </p>
                <button
                  className="mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                  onClick={() => (window.location.href = "/tenant-dashboard/billing")}
                >
                  Upgrade Now →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Total Stores */}
          <div className="bg-card rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Stores</h3>
              <div className="p-2 bg-accent rounded-lg">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.vendorStores.length || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Active storefronts</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-card rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
              <div className="p-2 bg-accent rounded-lg">
                <svg className="w-6 h-6 text-chart-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              $
              {stats?.vendorStores
                .reduce((sum, store) => sum + parseFloat(store.totalSales.toString()), 0)
                .toFixed(2) || "0.00"}
            </p>
            <p className="text-sm text-gray-500 mt-1">Across all stores</p>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
              <div className="p-2 bg-purple-50 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.vendorStores.reduce((sum, store) => sum + store.totalOrders, 0) || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">All time</p>
          </div>
        </div>

        {/* Usage Quotas */}
        <div className="bg-white rounded-xl shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Usage & Quotas</h2>
            <p className="text-sm text-gray-600 mt-1">Track your plan limits</p>
          </div>
          <div className="p-6 space-y-6">
            {/* Products */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Products</span>
                <span className="text-sm text-gray-600">
                  {stats?.currentProducts} / {stats?.maxProducts}
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${Math.min(productUsagePercent, 100)}%`,
                    backgroundColor:
                      productUsagePercent >= 90 ? "#ef4444" : productUsagePercent >= 75 ? "#f59e0b" : tenant.primaryColor,
                  }}
                />
              </div>
              {productUsagePercent >= 90 && (
                <p className="text-xs text-red-600 mt-1">⚠️ Near limit - Consider upgrading</p>
              )}
            </div>

            {/* Orders */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Orders (This Month)</span>
                <span className="text-sm text-gray-600">
                  {stats?.currentOrders} / {stats?.maxOrders}
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${Math.min(orderUsagePercent, 100)}%`,
                    backgroundColor:
                      orderUsagePercent >= 90 ? "#ef4444" : orderUsagePercent >= 75 ? "#f59e0b" : tenant.primaryColor,
                  }}
                />
              </div>
              {orderUsagePercent >= 90 && (
                <p className="text-xs text-red-600 mt-1">⚠️ Near limit - Consider upgrading</p>
              )}
            </div>

            {/* Storage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Storage</span>
                <span className="text-sm text-gray-600">
                  {stats?.currentStorageGB.toString()} GB / {stats?.maxStorageGB.toString()} GB
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${Math.min(storageUsagePercent, 100)}%`,
                    backgroundColor:
                      storageUsagePercent >= 90 ? "#ef4444" : storageUsagePercent >= 75 ? "#f59e0b" : tenant.primaryColor,
                  }}
                />
              </div>
              {storageUsagePercent >= 90 && (
                <p className="text-xs text-red-600 mt-1">⚠️ Near limit - Consider upgrading</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Manage Stores */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Stores</h3>
            {stats?.vendorStores && stats.vendorStores.length > 0 ? (
              <div className="space-y-3">
                {stats.vendorStores.map((store) => (
                  <div key={store.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{store.name}</p>
                      <p className="text-sm text-gray-600">
                        {store.totalOrders} orders · ${parseFloat(store.totalSales.toString()).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => (window.location.href = `/dashboard?store=${store.id}`)}
                      className="text-sm font-medium hover:underline"
                      style={{ color: tenant.primaryColor }}
                    >
                      Manage →
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No stores yet</p>
                <button
                  onClick={() => (window.location.href = "/create-store")}
                  className="px-4 py-2 rounded-lg font-medium text-white"
                  style={{ backgroundColor: tenant.primaryColor }}
                >
                  Create Your First Store
                </button>
              </div>
            )}
          </div>

          {/* Billing */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Subscription & Billing</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Current Plan</span>
                <span className="font-semibold text-gray-900">{stats?.subscriptionPlan}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Platform Fee</span>
                <span className="font-semibold text-gray-900">{stats?.platformFeePercent}%</span>
              </div>
              {stats?.trialEndsAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Trial Ends</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(stats.trialEndsAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="pt-4 border-t">
                <button
                  onClick={() => (window.location.href = "/tenant-dashboard/billing")}
                  className="w-full px-4 py-2 border-2 rounded-lg font-medium hover:bg-gray-50 transition"
                  style={{ borderColor: tenant.primaryColor, color: tenant.primaryColor }}
                >
                  Manage Billing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
