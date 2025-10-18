"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type ShippingSettings = {
  flatRate: number | null
  freeShippingThreshold: number | null
  localPickupEnabled: boolean
}

export default function ShippingSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<ShippingSettings>({
    flatRate: null,
    freeShippingThreshold: null,
    localPickupEnabled: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/dashboard/settings/shipping")

      if (response.status === 401) {
        router.push("/login")
        return
      }

      if (!response.ok) {
        throw new Error("Failed to fetch shipping settings")
      }

      const data = await response.json()
      setSettings(data.settings)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch("/api/dashboard/settings/shipping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save settings")
      }

      setSuccessMessage("Shipping settings saved successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Settings</h1>
          <p className="mt-1 text-sm text-gray-600">Configure shipping options for your store</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shipping Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configure how shipping costs are calculated for your store
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded">
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded">
          <div className="flex">
            <svg
              className="h-5 w-5 text-green-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* Flat Rate Shipping */}
        <div>
          <label
            htmlFor="flatRate"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Flat Rate Shipping
          </label>
          <div className="flex items-start">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
              $
            </span>
            <input
              type="number"
              id="flatRate"
              value={settings.flatRate || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  flatRate: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              min="0"
              step="0.01"
              className="flex-1 rounded-none rounded-r-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
              placeholder="0.00"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Set a flat shipping rate for all orders. Leave empty for free shipping.
          </p>
        </div>

        {/* Free Shipping Threshold */}
        <div>
          <label
            htmlFor="freeShippingThreshold"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Free Shipping Threshold
          </label>
          <div className="flex items-start">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
              $
            </span>
            <input
              type="number"
              id="freeShippingThreshold"
              value={settings.freeShippingThreshold || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  freeShippingThreshold: e.target.value
                    ? parseFloat(e.target.value)
                    : null,
                })
              }
              min="0"
              step="0.01"
              className="flex-1 rounded-none rounded-r-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
              placeholder="0.00"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Offer free shipping when order total exceeds this amount. Leave empty to disable.
          </p>
        </div>

        {/* Local Pickup */}
        <div>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="localPickupEnabled"
                type="checkbox"
                checked={settings.localPickupEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    localPickupEnabled: e.target.checked,
                  })
                }
                className="h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <div className="ml-3">
              <label
                htmlFor="localPickupEnabled"
                className="text-sm font-medium text-gray-700"
              >
                Enable Local Pickup
              </label>
              <p className="text-sm text-gray-500">
                Allow customers to pick up their orders in person (no shipping charge)
              </p>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Shipping Preview</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Standard Shipping:</span>
              <span className="font-medium text-gray-900">
                {settings.flatRate ? `$${settings.flatRate.toFixed(2)}` : "Free"}
              </span>
            </div>
            {settings.freeShippingThreshold && (
              <div className="flex justify-between">
                <span className="text-gray-600">Free Shipping on orders over:</span>
                <span className="font-medium text-gray-900">
                  ${settings.freeShippingThreshold.toFixed(2)}
                </span>
              </div>
            )}
            {settings.localPickupEnabled && (
              <div className="flex justify-between">
                <span className="text-gray-600">Local Pickup:</span>
                <span className="font-medium text-green-600">Available (Free)</span>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  )
}
