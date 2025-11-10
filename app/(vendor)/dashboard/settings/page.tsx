"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface Store {
  id: string
  name: string
  slug: string
  email: string
  phone?: string
  description?: string
  tagline?: string
  logoUrl?: string
  bannerUrl?: string
  stripeAccountId?: string
  stripeChargesEnabled: boolean
  stripeDetailsSubmitted: boolean
  isActive: boolean
}

export default function SettingsPage() {
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchStore()
  }, [])

  async function fetchStore() {
    try {
      const response = await fetch("/api/vendor/stores")

      if (!response.ok) {
        throw new Error("Failed to fetch store")
      }

      const data = await response.json()
      setStore(data.store)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      tagline: formData.get("tagline"),
      description: formData.get("description"),
    }

    try {
      const response = await fetch("/api/vendor/stores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to update store")
      }

      const result = await response.json()
      setStore(result.store)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update store")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error && !store) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
        <p className="text-gray-600 mt-2">Manage your store information and preferences</p>
      </div>

      {/* Settings Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-4 border-b">
          <button className="px-4 py-2 text-blue-600 border-b-2 border-blue-600 font-medium">
            General
          </button>
          <Link
            href="/dashboard/settings/shipping"
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Shipping
          </Link>
        </nav>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">Settings saved successfully!</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* General Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Store Information</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Store Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                defaultValue={store?.name}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                Store URL
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 text-sm mr-2">
                  {typeof window !== "undefined" && window.location.origin}/store/
                </span>
                <input
                  type="text"
                  id="slug"
                  value={store?.slug}
                  disabled
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Store URL cannot be changed after creation
              </p>
            </div>

            <div>
              <label htmlFor="tagline" className="block text-sm font-medium text-gray-700 mb-1">
                Tagline
              </label>
              <input
                type="text"
                id="tagline"
                name="tagline"
                defaultValue={store?.tagline || ""}
                maxLength={100}
                placeholder="A brief description of your store"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum 100 characters</p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                defaultValue={store?.description || ""}
                rows={4}
                placeholder="Tell customers about your store..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                defaultValue={store?.email}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                defaultValue={store?.phone || ""}
                placeholder="(555) 123-4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Payment Settings</h2>

          <div className="space-y-4">
            {store?.stripeAccountId ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">Stripe Connected</p>
                    <p className="text-sm text-gray-600">
                      Account ID: {store.stripeAccountId}
                    </p>
                  </div>
                  <div>
                    {store.stripeChargesEnabled ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
                        Pending Setup
                      </span>
                    )}
                  </div>
                </div>
                {!store.stripeChargesEnabled && (
                  <p className="text-sm text-amber-600">
                    Complete your Stripe onboarding to accept payments
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  Stripe is not connected. You won&apos;t be able to accept payments until you complete the Stripe setup.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Store Status</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Store Visibility</p>
              <p className="text-sm text-gray-600">
                Your store is currently {store?.isActive ? "active" : "inactive"}
              </p>
            </div>
            <div>
              {store?.isActive ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                  Active
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded-full">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  )
}
