"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface CancelSubscriptionButtonProps {
  tenantId: string
}

export default function CancelSubscriptionButton({
  tenantId,
}: CancelSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [cancelImmediately, setCancelImmediately] = useState(false)
  const [reason, setReason] = useState("")
  const router = useRouter()

  const handleCancel = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/billing/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          reason,
          cancelImmediately,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel subscription")
      }

      alert(data.message)
      setShowModal(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
      >
        Cancel Subscription
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Cancel Subscription?
            </h3>

            <p className="text-gray-600 mb-4">
              We're sorry to see you go. Please let us know why you're canceling:
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Your feedback helps us improve..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 h-24 resize-none"
            />

            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cancelImmediately}
                  onChange={(e) => setCancelImmediately(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">
                  Cancel immediately (lose access now)
                </span>
              </label>
              {!cancelImmediately && (
                <p className="text-xs text-gray-500 mt-2">
                  By default, you'll have access until the end of your billing period.
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {loading ? "Canceling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
