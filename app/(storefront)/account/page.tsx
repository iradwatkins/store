"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Package, ShoppingBag, User, CreditCard } from "lucide-react"
import { logger } from "@/lib/logger"

interface OrderSummary {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
  itemCount: number
  fulfillmentStatus?: string
}

export default function CustomerAccountPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/account")
    }

    if (status === "authenticated") {
      // Fetch user's orders
      fetch("/api/account/orders")
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch orders")
          }
          return res.json()
        })
        .then((data) => {
          setOrders(data.orders || [])
          setError(null)
        })
        .catch((err) => {
          logger.error("Failed to load orders:", err)
          setError(err.message || "Failed to load orders")
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [status, router])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const pendingOrders = orders.filter((o) => o.status === "PENDING").length
  const deliveredOrders = orders.filter((o) => o.fulfillmentStatus === "DELIVERED").length

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="mt-2 text-gray-600">Welcome back, {session.user.name || session.user.email}</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow p-4 space-y-2">
              <Link
                href="/account"
                className="block px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md"
              >
                Dashboard
              </Link>
              <Link
                href="/account/orders"
                className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                My Orders
              </Link>
              <Link
                href="/products"
                className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Browse Products
              </Link>
              {session.user.vendor_stores ? (
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-md border border-blue-200"
                >
                  Vendor Dashboard →
                </Link>
              ) : (
                <Link
                  href="/create-store"
                  className="block px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md text-center"
                >
                  Open a Store
                </Link>
              )}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Success Banner for New Vendors */}
            {session.user.vendor_stores && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white bg-opacity-30">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">
                        You&apos;re Now a Vendor!
                      </h3>
                      <p className="text-green-50 text-sm mb-3">
                        Your store is ready to go. Start adding products and customizing your storefront.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href="/dashboard"
                          className="inline-flex items-center px-4 py-2 bg-white text-green-600 text-sm font-semibold rounded-md hover:bg-green-50 shadow-sm transition-colors"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                            />
                          </svg>
                          Go to Vendor Dashboard
                        </Link>
                        <Link
                          href="/dashboard/products/new"
                          className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 text-white text-sm font-semibold rounded-md hover:bg-opacity-30 backdrop-blur-sm transition-colors"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          Add Your First Product
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vendor Invitation Banner (only show if user doesn't have a store) */}
            {!session.user.vendor_stores && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-8 sm:px-8">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Start Selling Your Products Today!
                      </h3>
                      <p className="text-blue-100 text-sm mb-4">
                        Join our marketplace and reach thousands of customers. Set up your store in minutes and start earning.
                      </p>
                      <ul className="text-blue-100 text-sm space-y-1 mb-4">
                        <li className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Easy setup in under 10 minutes
                        </li>
                        <li className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Secure payment processing with Stripe
                        </li>
                        <li className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          No upfront costs or monthly fees
                        </li>
                      </ul>
                    </div>
                    <div className="flex-shrink-0">
                      <Link
                        href="/create-store"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-500 bg-white hover:bg-blue-50 shadow-lg transform hover:scale-105 transition-all"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Open Your Store
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-red-400 mt-0.5 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">Error loading orders</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-2 text-sm font-medium text-red-800 hover:text-red-900 underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-500">Total Orders</div>
                  <ShoppingBag className="text-green-600" size={24} />
                </div>
                <div className="mt-2 text-3xl font-bold text-gray-900">{orders.length}</div>
                <p className="mt-1 text-xs text-gray-500">{pendingOrders} pending</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-500">Total Spent</div>
                  <CreditCard className="text-blue-600" size={24} />
                </div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  ${orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                </div>
                <p className="mt-1 text-xs text-gray-500">All time</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-500">Delivered</div>
                  <Package className="text-purple-600" size={24} />
                </div>
                <div className="mt-2 text-3xl font-bold text-gray-900">{deliveredOrders}</div>
                <p className="mt-1 text-xs text-gray-500">Completed orders</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-500">Account Type</div>
                  <User className="text-orange-600" size={24} />
                </div>
                <div className="mt-2 text-lg font-semibold text-gray-900">
                  {session.user.vendor_stores ? "Customer & Vendor" : "Customer"}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Member since {new Date(session.user.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              </div>
              <div className="p-6">
                {orders.length === 0 ? (
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
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Start shopping to see your orders here</p>
                    <div className="mt-6">
                      <Link
                        href="/products"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        Browse Products
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <Link
                        key={order.id}
                        href={`/account/orders/${order.id}`}
                        className="block border border-gray-200 rounded-lg p-4 hover:border-green-600 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Order {order.orderNumber}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()} • {order.itemCount}{" "}
                              {order.itemCount === 1 ? "item" : "items"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              ${order.total.toFixed(2)}
                            </div>
                            <div className="mt-1">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  order.status === "DELIVERED"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "SHIPPED"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {orders.length > 5 && (
                      <Link
                        href="/account/orders"
                        className="block text-center text-sm font-medium text-green-600 hover:text-green-700 pt-2"
                      >
                        View all orders →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {!session.user.vendor_stores && (
                  <Link
                    href="/create-store"
                    className="flex items-center p-5 border-2 border-blue-300 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 hover:border-blue-400 transition-all shadow-sm hover:shadow-md group"
                  >
                    <div className="mr-4 flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <div className="text-base font-semibold text-gray-900 mb-1">Become a Vendor</div>
                      <div className="text-sm text-gray-600">
                        Start selling and earn money
                      </div>
                    </div>
                  </Link>
                )}
                <Link
                  href="/products"
                  className="flex items-center p-5 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all shadow-sm hover:shadow-md group"
                >
                  <div className="mr-4 flex-shrink-0">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <div className="text-base font-semibold text-gray-900 mb-1">Browse Products</div>
                    <div className="text-sm text-gray-600">Discover unique items</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
