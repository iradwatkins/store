"use client"

import { useState } from "react"

interface CustomerPortalButtonProps {
  tenantId: string
  primaryColor: string
}

export default function CustomerPortalButton({
  tenantId,
  primaryColor,
}: CustomerPortalButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/billing/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to open customer portal")
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message || "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-sm font-medium hover:underline disabled:opacity-50"
        style={{ color: primaryColor }}
      >
        {loading ? "Loading..." : "Update"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </>
  )
}
