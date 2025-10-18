import { getCurrentTenant } from "@/lib/tenant"

export default async function TenantDemoPage() {
  const tenant = await getCurrentTenant()

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">No Tenant Found</h1>
          <p className="text-gray-600 mb-6">
            This page is only accessible via a tenant subdomain like{" "}
            <code className="bg-gray-200 px-2 py-1 rounded">nike.stepperslife.com</code>
          </p>
          <p className="text-sm text-gray-500">
            You&apos;re currently on the main domain. Try accessing:
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="text-green-600">• nike.stepperslife.com/tenant-demo</li>
            <li className="text-green-600">• adidas.stepperslife.com/tenant-demo</li>
            <li className="text-green-600">• localshop.stepperslife.com/tenant-demo</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{
        background: `linear-gradient(to bottom right, ${tenant.primaryColor}15, ${tenant.primaryColor}05)`,
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Tenant Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-6">
            {tenant.logoUrl && (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900">{tenant.name}</h1>
              <p className="text-gray-600 mt-1">
                <span className="font-mono text-sm">{tenant.slug}.stepperslife.com</span>
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: tenant.primaryColor }}
                >
                  {tenant.subscriptionPlan}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    tenant.subscriptionStatus === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : tenant.subscriptionStatus === "TRIAL"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {tenant.subscriptionStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tenant Info Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Subscription Details */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-600">Plan</dt>
                <dd className="text-lg font-semibold text-gray-900">{tenant.subscriptionPlan}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Status</dt>
                <dd className="text-lg font-semibold text-gray-900">{tenant.subscriptionStatus}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Platform Fee</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {tenant.platformFeePercent}%
                </dd>
              </div>
              {tenant.trialEndsAt && (
                <div>
                  <dt className="text-sm text-gray-600">Trial Ends</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {new Date(tenant.trialEndsAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Usage Stats */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Usage</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-600">Products</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {tenant.currentProducts} / {tenant.maxProducts}
                </dd>
                <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${(tenant.currentProducts / tenant.maxProducts) * 100}%`,
                      backgroundColor: tenant.primaryColor,
                    }}
                  />
                </div>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Orders (this month)</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {tenant.currentOrders} / {tenant.maxOrders}
                </dd>
                <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${(tenant.currentOrders / tenant.maxOrders) * 100}%`,
                      backgroundColor: tenant.primaryColor,
                    }}
                  />
                </div>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Storage</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {tenant.currentStorageGB.toString()} GB / {tenant.maxStorageGB.toString()} GB
                </dd>
                <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${
                        (parseFloat(tenant.currentStorageGB.toString()) /
                          parseFloat(tenant.maxStorageGB.toString())) *
                        100
                      }%`,
                      backgroundColor: tenant.primaryColor,
                    }}
                  />
                </div>
              </div>
            </dl>
          </div>
        </div>

        {/* Brand Customization */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Brand Customization</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Primary Color</label>
              <div className="flex items-center gap-3 mt-1">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-gray-200"
                  style={{ backgroundColor: tenant.primaryColor }}
                />
                <span className="font-mono text-gray-900">{tenant.primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Sample Button</label>
              <div className="mt-2">
                <button
                  className="px-6 py-3 rounded-lg font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: tenant.primaryColor }}
                >
                  Branded Button
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Domain */}
        {tenant.customDomain && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Custom Domain</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">{tenant.customDomain}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Status:{" "}
                  <span
                    className={
                      tenant.customDomainVerified ? "text-green-600" : "text-yellow-600"
                    }
                  >
                    {tenant.customDomainVerified ? "Verified" : "Pending Verification"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-sm">
          <p className="mb-2">🔧 Debug Info:</p>
          <p>• Tenant ID: {tenant.id}</p>
          <p>• Subdomain: {tenant.slug}</p>
          <p>• Primary Color: {tenant.primaryColor}</p>
          <p>• Multi-tenancy: ✅ Working!</p>
        </div>
      </div>
    </div>
  )
}
