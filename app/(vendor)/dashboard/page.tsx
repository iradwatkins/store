import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import LowStockAlert from "./components/LowStockAlert"

async function getDashboardData(userId: string) {
  const store = await prisma.vendor_stores.findFirst({
    where: {
      userId,
    },
    include: {
      _count: {
        select: {
          products: true,
          store_orders: true,
        },
      },
    },
  })

  if (!store) {
    return null
  }

  // Get recent orders
  const recentOrders = await prisma.store_orders.findMany({
    where: {
      vendorStoreId: store.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      total: true,
      status: true,
      createdAt: true,
    },
  })

  return {
    store,
    recentOrders,
  }
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Redirect admins to admin dashboard
  if (session.user.role === "ADMIN") {
    redirect("/admin")
  }

  const data = await getDashboardData(session.user.id)

  if (!data) {
    redirect("/create-store")
  }

  const { store, recentOrders } = data

  const hasNoProducts = store._count.products === 0
  const needsStripeSetup = !store.stripeChargesEnabled

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back! Here&apos;s an overview of your store.
        </p>
      </div>

      {/* Low Stock Alert */}
      <LowStockAlert />

      {/* Welcome Banner for New Vendors */}
      {hasNoProducts && needsStripeSetup && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white bg-opacity-30">
                  <svg
                    className="h-8 w-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Welcome to Your Vendor Dashboard!
                </h3>
                <p className="text-blue-100 mb-4">
                  Your store is created! Let&apos;s get you set up to start selling. Complete these quick steps:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white text-blue-500 font-bold">
                          1
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-semibold text-white mb-1">Add Your First Product</p>
                        <p className="text-xs text-blue-100 mb-2">
                          List your products with photos and descriptions
                        </p>
                        <Link
                          href="/dashboard/products/new"
                          className="inline-flex items-center px-3 py-1.5 bg-white text-blue-500 text-sm font-medium rounded hover:bg-blue-50 transition-colors"
                        >
                          Add Product
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white text-purple-600 font-bold">
                          2
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-semibold text-white mb-1">Setup Payment Processing</p>
                        <p className="text-xs text-blue-100 mb-2">
                          Connect Stripe to accept payments and receive payouts
                        </p>
                        <Link
                          href="/dashboard/settings"
                          className="inline-flex items-center px-3 py-1.5 bg-white text-purple-600 text-sm font-medium rounded hover:bg-purple-50 transition-colors"
                        >
                          Setup Payments
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Reminder Banner */}
      {hasNoProducts && !needsStripeSetup && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
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
            </div>
            <div className="ml-3 flex-1 flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Get started:</strong> Add your first product to start selling!
                </p>
              </div>
              <Link
                href="/dashboard/products/new"
                className="ml-4 flex-shrink-0 inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600"
              >
                Add Product
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stripe Setup Banner */}
      {!hasNoProducts && needsStripeSetup && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1 flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700">
                  <strong>Action Required:</strong> Complete your Stripe setup to start accepting payments and processing orders.
                </p>
              </div>
              <Link
                href="/dashboard/settings"
                className="ml-4 flex-shrink-0 inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700"
              >
                Complete Setup
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
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
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {store._count.products}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link href="/dashboard/products" className="text-sm font-medium text-blue-500 hover:text-blue-400">
              View all
            </Link>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
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
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{store._count.store_orders}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link href="/dashboard/orders" className="text-sm font-medium text-blue-500 hover:text-blue-400">
              View all
            </Link>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    ${store.totalSales.toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link href="/dashboard/analytics" className="text-sm font-medium text-blue-500 hover:text-blue-400">
              View Analytics Dashboard
            </Link>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div
                  className={`h-3 w-3 rounded-full ${
                    store.isActive ? "bg-green-400" : "bg-red-400"
                  }`}
                />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Store Status</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {store.isActive ? "Active" : "Inactive"}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link href="/dashboard/settings" className="text-sm font-medium text-blue-500 hover:text-blue-400">
              Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start adding products to your store to receive orders.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/products/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600"
                >
                  Add Product
                </Link>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === "PAID"
                            ? "bg-green-100 text-green-800"
                            : order.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600"
          >
            Add Product
          </Link>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            View Orders
          </Link>
          <Link
            href={`/store/${store.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Preview Store
          </Link>
        </div>
      </div>
    </div>
  )
}
