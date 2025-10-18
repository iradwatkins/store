"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

type Order = {
  orderNumber: string
  createdAt: string
  customerName: string
  customerEmail: string
  shippingAddress: {
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    zipCode: string
  }
  items: Array<{
    name: string
    variantName: string | null
    quantity: number
    price: number
    imageUrl: string | null
  }>
  subtotal: number
  shippingCost: number
  taxAmount: number
  total: number
  vendorStore: {
    name: string
    slug: string
    email: string
  }
}

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentIntentId = searchParams.get("payment_intent")

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!paymentIntentId) {
      router.push("/")
      return
    }

    fetchOrderDetails()
  }, [paymentIntentId])

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/confirm?payment_intent=${paymentIntentId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load order details")
      }

      setOrder(data.order)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 mx-auto text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="mt-4 text-gray-600">Loading your order confirmation...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Order Not Found</h3>
          <p className="mt-2 text-gray-500">{error || "Unable to load order details"}</p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="h-10 w-10 text-green-600"
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
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Order Confirmed!</h1>
          <p className="mt-2 text-lg text-gray-600">
            Thank you for your purchase, {order.customerName}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Order #{order.orderNumber}
          </p>
        </div>

        {/* Confirmation Email Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                A confirmation email has been sent to{" "}
                <span className="font-medium">{order.customerEmail}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Details</h2>

          {/* Items */}
          <div className="space-y-4 mb-6">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-start space-x-4">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-20 w-20 rounded-md object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-md bg-gray-200 flex items-center justify-center">
                    <svg
                      className="h-10 w-10 text-gray-400"
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
                <div className="flex-1">
                  <p className="text-base font-medium text-gray-900">{item.name}</p>
                  {item.variantName && (
                    <p className="text-sm text-gray-500">{item.variantName}</p>
                  )}
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <p className="text-base font-medium text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-900">
              <p>Subtotal</p>
              <p>${order.subtotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between text-sm text-gray-900">
              <p>Shipping</p>
              <p>${order.shippingCost.toFixed(2)}</p>
            </div>
            <div className="flex justify-between text-sm text-gray-900">
              <p>Tax</p>
              <p>${order.taxAmount.toFixed(2)}</p>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between text-lg font-medium text-gray-900">
                <p>Total</p>
                <p>${order.total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h2>
          <p className="text-gray-900">{order.customerName}</p>
          <p className="text-gray-600">{order.shippingAddress.addressLine1}</p>
          {order.shippingAddress.addressLine2 && (
            <p className="text-gray-600">{order.shippingAddress.addressLine2}</p>
          )}
          <p className="text-gray-600">
            {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.zipCode}
          </p>
        </div>

        {/* Vendor Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Sold by</h2>
          <p className="text-gray-900 font-medium">{order.vendorStore.name}</p>
          <p className="text-sm text-gray-500 mt-1">
            Questions? Contact: {order.vendorStore.email}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={`/store/${order.vendorStore.slug}`}
            className="flex-1 px-6 py-3 border border-gray-300 text-center text-gray-700 font-medium rounded-md hover:bg-gray-50"
          >
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="flex-1 px-6 py-3 bg-blue-500 text-center text-white font-medium rounded-md hover:bg-blue-600"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
