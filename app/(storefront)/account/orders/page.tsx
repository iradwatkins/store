"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Order = {
  id: string
  orderNumber: string
  createdAt: string
  shippedAt: string | null
  paymentStatus: string
  items: Array<{
    id: string
    productId: string
    name: string
    quantity: number
    imageUrl: string | null
    variantName: string | null
    review: {
      id: string
      rating: number
      createdAt: string
    } | null
  }>
  total: number
  status: string
  fulfillmentStatus: string
  trackingNumber: string | null
  carrier: string | null
  vendorStore: {
    name: string
    slug: string
  }
}

export default function CustomerOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/account/orders")
      return
    }

    if (status === "authenticated") {
      fetchOrders()
    }
  }, [status])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/account/orders")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch orders")
      }

      setOrders(data.orders)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      case "REFUNDED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getFulfillmentBadgeColor = (status: string) => {
    switch (status) {
      case "UNFULFILLED":
        return "bg-orange-100 text-orange-800"
      case "SHIPPED":
        return "bg-blue-100 text-blue-800"
      case "DELIVERED":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const canReviewItem = (order: Order, item: typeof order.items[0]) => {
    // Already reviewed
    if (item.review) return false

    // Must be paid
    if (order.paymentStatus !== "PAID") return false

    // Must be shipped
    if (!order.shippedAt) return false

    // Must be at least 3 days since shipment
    const shippedDate = new Date(order.shippedAt)
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    if (shippedDate > threeDaysAgo) return false

    // Must not be more than 100 days old
    const hundredDaysAgo = new Date()
    hundredDaysAgo.setDate(hundredDaysAgo.getDate() - 100)
    if (shippedDate < hundredDaysAgo) return false

    return true
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading orders...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="mt-2 text-gray-600">Track and view your order history</p>
        </div>

        {/* Orders List */}
        {error ? (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center">
              <div className="text-red-600 mb-2">
                <svg
                  className="h-12 w-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-900 font-medium">{error}</p>
              <button
                onClick={fetchOrders}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg
              className="h-16 w-16 mx-auto text-gray-400"
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
            <h3 className="mt-4 text-lg font-medium text-gray-900">No orders yet</h3>
            <p className="mt-2 text-gray-500">When you place orders, they'll appear here</p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Order Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order Number</p>
                      <p className="text-base font-medium text-gray-900">
                        {order.orderNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="text-base text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-base font-medium text-gray-900">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <div className="flex space-x-2 mt-1">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getFulfillmentBadgeColor(
                            order.fulfillmentStatus
                          )}`}
                        >
                          {order.fulfillmentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Body */}
                <div className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">
                        Sold by{" "}
                        <Link
                          href={`/store/${order.vendorStore.slug}`}
                          className="font-medium text-blue-500 hover:text-blue-900"
                        >
                          {order.vendorStore.name}
                        </Link>
                      </p>

                      {/* Items */}
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="h-16 w-16 rounded-md object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="h-16 w-16 rounded-md bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="h-8 w-8 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{item.name}</p>
                              {item.variantName && (
                                <p className="text-xs text-gray-500">{item.variantName}</p>
                              )}
                              <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>

                              {/* Review Status/Actions */}
                              <div className="mt-2">
                                {item.review ? (
                                  <div className="flex items-center space-x-2">
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                        <svg
                                          key={i}
                                          className={`h-4 w-4 ${
                                            i < item.review!.rating
                                              ? "text-yellow-400"
                                              : "text-gray-300"
                                          }`}
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      ))}
                                    </div>
                                    <span className="text-xs text-green-600 font-medium">
                                      Reviewed
                                    </span>
                                  </div>
                                ) : canReviewItem(order, item) ? (
                                  <Link
                                    href={`/products/${item.productId}/review?orderItemId=${item.id}&storeSlug=${order.vendorStore.slug}`}
                                    className="inline-flex items-center px-3 py-1 border border-blue-600 text-xs font-medium rounded text-blue-500 hover:bg-blue-50"
                                  >
                                    Write Review
                                  </Link>
                                ) : order.shippedAt && order.paymentStatus === "PAID" ? (
                                  <span className="text-xs text-gray-500">
                                    Review available soon
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Tracking Info */}
                      {order.trackingNumber && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-md">
                          <div className="flex items-start">
                            <svg
                              className="h-5 w-5 text-blue-400 mt-0.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                              />
                            </svg>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-blue-800">
                                Tracking Number
                              </p>
                              <p className="text-sm text-blue-700 font-mono">
                                {order.carrier}: {order.trackingNumber}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* View Details Button */}
                      <div className="mt-4">
                        <Link
                          href={`/account/orders/${order.id}`}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Order Details
                          <svg
                            className="ml-2 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
