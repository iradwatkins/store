"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"

type ShippingInfo = {
  email: string
  phone: string
  fullName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
}

type ShippingMethod = {
  id: string
  name: string
  price: number
  estimatedDays: string
}

type Props = {
  clientSecret: string
  shippingInfo: ShippingInfo
  shippingMethod: ShippingMethod
  onBack: () => void
}

export default function PaymentStep({
  clientSecret,
  shippingInfo,
  shippingMethod,
  onBack,
}: Props) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()

  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          receipt_email: shippingInfo.email,
        },
        redirect: "if_required",
      })

      if (error) {
        setErrorMessage(error.message || "Payment failed. Please try again.")
        setIsProcessing(false)
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment successful - redirect to confirmation page
        router.push(`/checkout/success?payment_intent=${paymentIntent.id}`)
      } else {
        setErrorMessage("Payment failed. Please try again.")
        setIsProcessing(false)
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred. Please try again.")
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-medium text-gray-900 mb-6">Payment</h2>

      {/* Review Order Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Review Your Order</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping to:</span>
            <span className="text-gray-900 font-medium">
              {shippingInfo.fullName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Address:</span>
            <span className="text-gray-900 text-right">
              {shippingInfo.addressLine1}
              {shippingInfo.addressLine2 && `, ${shippingInfo.addressLine2}`}
              <br />
              {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping method:</span>
            <span className="text-gray-900 font-medium">{shippingMethod.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="text-gray-900">{shippingInfo.email}</span>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <PaymentElement
            options={{
              layout: "tabs",
            }}
          />
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
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
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Trust Badges */}
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-green-500 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Secure Checkout
          </div>
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-blue-500 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            SSL Encrypted
          </div>
          <div className="flex items-center">
            <span className="font-semibold text-blue-500">Stripe</span>
            <span className="ml-1">Powered</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onBack}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="flex-1 px-6 py-3 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2"
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
                Processing...
              </span>
            ) : (
              "Place Order"
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          By placing your order, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </div>
  )
}
