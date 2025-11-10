"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface SubscribeButtonProps {
  tenantId: string
  planId: string
  planName: string
  planPrice: number
  priceId: string
  primaryColor: string
  isUpgrade: boolean
  isOnTrial: boolean
}

export default function SubscribeButton({
  tenantId,
  planId: _planId,
  planName,
  planPrice,
  priceId,
  primaryColor,
  isUpgrade,
  isOnTrial,
}: SubscribeButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = () => {
    setShowModal(true)
    setError(null)
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full px-4 py-3 rounded-lg font-medium text-white hover:opacity-90 transition disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}
      >
        {loading
          ? "Processing..."
          : isOnTrial
          ? `Start with ${planName}`
          : isUpgrade
          ? "Upgrade Now"
          : "Select Plan"}
      </button>

      {showModal && (
        <Elements
          stripe={stripePromise}
          options={{
            mode: "subscription",
            amount: planPrice * 100, // Amount in cents
            currency: "usd",
            appearance: {
              theme: "stripe",
            },
          }}
        >
          <CheckoutModal
            tenantId={tenantId}
            planName={planName}
            planPrice={planPrice}
            priceId={priceId}
            primaryColor={primaryColor}
            onClose={() => setShowModal(false)}
            setLoading={setLoading}
            setError={setError}
          />
        </Elements>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </>
  )
}

interface CheckoutModalProps {
  tenantId: string
  planName: string
  planPrice: number
  priceId: string
  primaryColor: string
  onClose: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

function CheckoutModal({
  tenantId,
  planName,
  planPrice,
  priceId,
  primaryColor,
  onClose,
  setLoading,
  setError,
}: CheckoutModalProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create subscription on backend
      const response = await fetch("/api/billing/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          priceId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create subscription")
      }

      // Confirm payment with Stripe
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/tenant-dashboard/billing?success=true`,
        },
      })

      if (stripeError) {
        setError(stripeError.message || "Payment failed")
        setLoading(false)
      } else {
        // Payment succeeded, redirect will happen automatically
        router.push("/tenant-dashboard/billing?success=true")
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscribe to {planName}</h2>
        <p className="text-gray-600 mb-6">
          You&apos;ll be charged <span className="font-semibold">${planPrice}/month</span>
        </p>

        {/* Payment Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <PaymentElement />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe}
              className="flex-1 px-4 py-3 rounded-lg font-medium text-white hover:opacity-90 transition disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              Subscribe ${planPrice}/mo
            </button>
          </div>
        </form>

        {/* Security notice */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          🔒 Secured by Stripe. Your payment information is encrypted.
        </p>
      </div>
    </div>
  )
}
