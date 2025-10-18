"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface ChangePlanButtonProps {
  tenantId: string
  currentPlanId: string
  newPlanId: string
  newPlanName: string
  newPlanPrice: number
  newPriceId: string
  primaryColor: string
  isDowngrade: boolean
}

export default function ChangePlanButton({
  tenantId,
  currentPlanId,
  newPlanId,
  newPlanName,
  newPlanPrice,
  newPriceId,
  primaryColor,
  isDowngrade,
}: ChangePlanButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleChangePlan = async () => {
    const actionText = isDowngrade ? "downgrade" : "upgrade"
    const confirmMessage = isDowngrade
      ? `Are you sure you want to downgrade to ${newPlanName}? Some features may be limited.`
      : `Upgrade to ${newPlanName} for $${newPlanPrice}/month?`

    if (!confirm(confirmMessage)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/billing/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          newPriceId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${actionText}`)
      }

      // Show quota violations if any
      if (data.quotaViolations && data.quotaViolations.length > 0) {
        const violationMessages = data.quotaViolations
          .map((v: any) => v.message)
          .join("\n")
        alert(
          `⚠️ Plan changed, but you have quota violations:\n\n${violationMessages}\n\nPlease address these issues.`
        )
      } else {
        alert(data.message || `Successfully ${actionText}d to ${newPlanName}!`)
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message || "Something went wrong")
      alert(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {isDowngrade ? (
        <button
          onClick={handleChangePlan}
          disabled={loading}
          className="w-full px-4 py-3 border-2 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
          style={{ borderColor: primaryColor, color: primaryColor }}
        >
          {loading ? "Processing..." : "Downgrade"}
        </button>
      ) : (
        <button
          onClick={handleChangePlan}
          disabled={loading}
          className="w-full px-4 py-3 rounded-lg font-medium text-white hover:opacity-90 transition disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          {loading ? "Processing..." : "Upgrade"}
        </button>
      )}

      {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
    </>
  )
}
