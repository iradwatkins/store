"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

interface OrderItem {
  id: string
  name: string
  variantName?: string
  sku?: string
  quantity: number
  price: number
  imageUrl?: string
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  shippingAddress: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  billingAddress: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  subtotal: number
  shippingCost: number
  taxAmount: number
  total: number
  status: string
  paymentStatus: string
  fulfillmentStatus: string
  shippingMethod?: string
  trackingNumber?: string
  carrier?: string
  customerNotes?: string
  createdAt: string
  items: OrderItem[]
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fulfilling, setFulfilling] = useState(false)

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  async function fetchOrder() {
    try {
      const response = await fetch(`/api/dashboard/orders/${orderId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch order")
      }

      const data = await response.json()
      setOrder(data.order)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  async function markAsFulfilled() {
    if (!confirm("Mark this order as fulfilled and shipped?")) return

    setFulfilling(true)
    try {
      const response = await fetch(`/api/dashboard/orders/${orderId}/fulfill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: (document.getElementById("trackingNumber") as HTMLInputElement)?.value,
          carrier: (document.getElementById("carrier") as HTMLInputElement)?.value,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to fulfill order")
      }

      await fetchOrder()
      alert("Order marked as fulfilled!")

      // Refresh the page after order update
      router.refresh()
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to fulfill order")
    } finally {
      setFulfilling(false)
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || "Order not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <Link
          href="/dashboard/orders"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          ← Back to Orders
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Order {order.orderNumber}
        </h1>
        <p className="text-gray-600 mt-2">{formatDate(order.createdAt)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 border-b pb-4 last:border-b-0">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    {item.variantName && (
                      <p className="text-sm text-gray-600">{item.variantName}</p>
                    )}
                    {item.sku && (
                      <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-900">{formatCurrency(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-900">{formatCurrency(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Fulfillment Section */}
          {order.fulfillmentStatus === "UNFULFILLED" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Fulfill Order</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    id="trackingNumber"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter tracking number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carrier
                  </label>
                  <input
                    type="text"
                    id="carrier"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., USPS, UPS, FedEx"
                  />
                </div>
                <button
                  onClick={markAsFulfilled}
                  disabled={fulfilling}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {fulfilling ? "Processing..." : "Mark as Fulfilled"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Customer</h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">{order.customerName}</p>
              <p className="text-gray-600">{order.customerEmail}</p>
              {order.customerPhone && (
                <p className="text-gray-600">{order.customerPhone}</p>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
            <div className="text-sm text-gray-600">
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.zipCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>

          {/* Order Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Status</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment</p>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                  {order.paymentStatus}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Fulfillment</p>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                  {order.fulfillmentStatus.replace(/_/g, " ")}
                </span>
              </div>
              {order.trackingNumber && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tracking</p>
                  <p className="text-sm font-medium">{order.trackingNumber}</p>
                  {order.carrier && (
                    <p className="text-sm text-gray-600">{order.carrier}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {order.customerNotes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Customer Notes</h2>
              <p className="text-sm text-gray-600">{order.customerNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
