"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

type OrderItem = {
  id: string
  name: string
  quantity: number
  price: number
  imageUrl: string | null
  variantName: string | null
}

type Order = {
  id: string
  orderNumber: string
  createdAt: string
  updatedAt: string
  status: string
  paymentStatus: string
  fulfillmentStatus: string
  total: number
  subtotal: number
  shippingCost: number
  taxAmount: number
  customerName: string
  customerEmail: string
  customerPhone: string | null
  shippingAddress: {
    fullName: string
    address1: string
    address2?: string
    city: string
    state: string
    zip: string
    country: string
  }
  trackingNumber: string | null
  carrier: string | null
  shippingMethod: string | null
  shippedAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
  cancelReason: string | null
  items: OrderItem[]
  vendor_stores: {
    name: string
    slug: string
    email: string | null
  }
}

export default function OrderTrackingPage() {
  const params = useParams()
  const { status } = useSession()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrder = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/account/orders/${params.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch order")
      }

      setOrder(data.order)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order")
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/account/orders/${params.id}`)
      return
    }

    if (status === "authenticated") {
      fetchOrder()
    }
  }, [status, params.id, router, fetchOrder])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "text-green-600 bg-green-50 border-green-200"
      case "PENDING":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "CANCELLED":
        return "text-red-600 bg-red-50 border-red-200"
      case "REFUNDED":
        return "text-gray-600 bg-gray-50 border-gray-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getTimelineSteps = () => {
    if (!order) {return []}

    const steps = [
      {
        label: "Order Placed",
        date: order.createdAt,
        completed: true,
        icon: "check",
      },
      {
        label: "Payment Confirmed",
        date: order.paymentStatus === "PAID" ? order.createdAt : null,
        completed: order.paymentStatus === "PAID",
        icon: order.paymentStatus === "PAID" ? "check" : "pending",
      },
      {
        label: "Shipped",
        date: order.shippedAt,
        completed: !!order.shippedAt,
        icon: order.shippedAt ? "check" : "pending",
      },
      {
        label: "Delivered",
        date: order.deliveredAt,
        completed: !!order.deliveredAt,
        icon: order.deliveredAt ? "check" : "pending",
      },
    ]

    if (order.cancelledAt) {
      return [
        steps[0],
        {
          label: "Order Cancelled",
          date: order.cancelledAt,
          completed: true,
          icon: "cancelled",
        },
      ]
    }

    return steps
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading order details...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-red-600 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-900 font-medium">{error || "Order not found"}</p>
            <Link href="/account/orders" className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const timelineSteps = getTimelineSteps()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/account/orders" className="text-blue-500 hover:text-blue-600 text-sm flex items-center mb-4">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </Link>
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order {order.orderNumber}</h1>
              <p className="mt-1 text-gray-600">
                Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h2>
              <div className="relative">
                {timelineSteps.map((step, index) => (
                  <div key={index} className="flex items-start mb-8 last:mb-0">
                    <div className="flex-shrink-0">
                      {step.icon === "check" ? (
                        <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : step.icon === "cancelled" ? (
                        <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
                          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <div className="h-3 w-3 rounded-full bg-white"></div>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-900">{step.label}</p>
                      {step.date && (
                        <p className="text-sm text-gray-500">
                          {new Date(step.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                      {!step.completed && step.icon === "pending" && (
                        <p className="text-xs text-gray-400 mt-1">Pending</p>
                      )}
                    </div>
                    {index < timelineSteps.length - 1 && (
                      <div className="absolute left-5 top-12 w-0.5 h-8 bg-gray-300" style={{ marginTop: "-8px" }}></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Cancel Reason */}
              {order.cancelReason && (
                <div className="mt-6 p-4 bg-red-50 rounded-md">
                  <p className="text-sm font-medium text-red-800">Cancellation Reason:</p>
                  <p className="text-sm text-red-700 mt-1">{order.cancelReason}</p>
                </div>
              )}
            </div>

            {/* Tracking Information */}
            {order.trackingNumber && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Carrier</p>
                    <p className="text-base font-medium text-gray-900">{order.carrier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tracking Number</p>
                    <p className="text-base font-mono text-gray-900">{order.trackingNumber}</p>
                  </div>
                  {order.shippingMethod && (
                    <div>
                      <p className="text-sm text-gray-600">Shipping Method</p>
                      <p className="text-base text-gray-900">{order.shippingMethod}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start space-x-4 pb-4 border-b last:border-b-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-20 w-20 rounded-md object-cover" />
                    ) : (
                      <div className="h-20 w-20 rounded-md bg-gray-200 flex items-center justify-center">
                        <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-base font-medium text-gray-900">{item.name}</p>
                      {item.variantName && <p className="text-sm text-gray-500">{item.variantName}</p>}
                      <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                      <p className="text-base font-medium text-gray-900 mt-1">${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">${order.shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">${order.taxAmount.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-gray-900">Total</span>
                    <span className="text-base font-semibold text-gray-900">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>

            {/* Vendor Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Seller</h2>
              <p className="text-base font-medium text-gray-900">{order.vendor_stores.name}</p>
              <Link href={`/store/${order.vendor_stores.slug}`} className="text-sm text-blue-500 hover:text-blue-600 mt-2 inline-block">
                Visit Store
              </Link>
              {order.vendor_stores.email && (
                <p className="text-sm text-gray-600 mt-2">
                  <a href={`mailto:${order.vendor_stores.email}`} className="text-blue-500 hover:text-blue-600">
                    Contact Seller
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
