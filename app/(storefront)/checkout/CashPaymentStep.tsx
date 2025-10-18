"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Props = {
  shippingInfo: {
    email: string
    phone: string
    fullName: string
    addressLine1: string
    addressLine2: string
    city: string
    state: string
    zipCode: string
  }
  shippingMethod: {
    id: string
    name: string
    price: number
    estimatedDays: string
  }
  total: number
  subtotal: number
  tax: number
  cartSessionId: string
  cashInstructions?: string
  onBack: () => void
}

export default function CashPaymentStep({
  shippingInfo,
  shippingMethod,
  total,
  subtotal,
  tax,
  cartSessionId,
  cashInstructions,
  onBack,
}: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirmOrder = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/orders/create-cash-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartSessionId,
          customerName: shippingInfo.fullName,
          customerEmail: shippingInfo.email,
          customerPhone: shippingInfo.phone,
          shippingAddress: {
            fullName: shippingInfo.fullName,
            addressLine1: shippingInfo.addressLine1,
            addressLine2: shippingInfo.addressLine2 || "",
            city: shippingInfo.city,
            state: shippingInfo.state,
            zipCode: shippingInfo.zipCode,
            phone: shippingInfo.phone,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order")
      }

      // Redirect to success page
      router.push(`/checkout/success?order_number=${data.order.orderNumber}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-medium text-gray-900 mb-6">Cash Payment</h2>

      {/* Cash Payment Instructions */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Cash Payment Required</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p className="mb-2">
                You have selected to pay with cash. Please note:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Payment will be collected when you pickup your order</li>
                <li>Please bring exact change if possible</li>
                <li>Your order will be confirmed once payment is received</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Instructions from Store */}
      {cashInstructions && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Pickup Instructions</h3>
          <p className="text-sm text-blue-700 whitespace-pre-line">{cashInstructions}</p>
        </div>
      )}

      {/* Order Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="text-gray-900">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping ({shippingMethod.name}):</span>
            <span className="text-gray-900">
              {shippingMethod.price === 0 ? "Free" : `$${shippingMethod.price.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax:</span>
            <span className="text-gray-900">${tax.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-300 pt-2 flex justify-between font-medium">
            <span className="text-gray-900">Total (Cash Payment):</span>
            <span className="text-gray-900">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleConfirmOrder}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Placing Order..." : "Confirm Cash Order"}
        </button>
      </div>
    </div>
  )
}
