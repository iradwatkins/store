import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"

async function getVendorStore(userId: string) {
  return await prisma.vendorStore.findFirst({
    where: {
      userId,
    },
  })
}

export default async function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Redirect to login if not authenticated
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Admins can access vendor dashboard to manage products even without their own store
  const isAdmin = session.user.role === "ADMIN"

  // Check if user has a store
  const store = await getVendorStore(session.user.id)

  // Redirect to create store if they don't have one (unless they're an admin)
  if (!store && !isAdmin) {
    redirect("/create-store")
  }

  // If admin without store, show admin-specific layout
  if (isAdmin && !store) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Top Navigation - Admin Mode */}
        <nav className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg border-b border-purple-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <span className="px-3 py-1 bg-yellow-400 text-purple-900 text-xs font-bold rounded mr-3">ADMIN</span>
                  <h1 className="text-xl font-bold text-white">Vendor Dashboard (Admin View)</h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <a
                  href="/admin"
                  className="text-sm text-white hover:text-yellow-300 font-medium transition-colors"
                >
                  ← Back to Admin Panel
                </a>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-purple-100">{session.user.email}</span>
                  <form action="/api/auth/signout" method="POST">
                    <button
                      type="submit"
                      className="text-sm text-white hover:text-yellow-300 font-medium transition-colors"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong className="font-medium">Admin Mode:</strong> You're accessing vendor functionality without a vendor store. Some features may be limited.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="bg-white rounded-lg shadow p-6">{children}</main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href={`/store/${store.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                View Store
              </a>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{session.user.email}</span>
                <form action="/api/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="mt-5 px-2 space-y-1">
            <a
              href="/dashboard"
              className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-900 hover:bg-gray-50"
            >
              <svg
                className="mr-4 h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Dashboard
            </a>

            <a
              href="/dashboard/products"
              className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <svg
                className="mr-4 h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              Products
            </a>

            <a
              href="/dashboard/orders"
              className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <svg
                className="mr-4 h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Orders
            </a>

            <a
              href="/dashboard/analytics"
              className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <svg
                className="mr-4 h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Analytics
            </a>

            <a
              href="/dashboard/settings"
              className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <svg
                className="mr-4 h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
