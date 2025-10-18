"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Store = {
  id: string
  name: string
  slug: string
  email: string
  phone: string | null
  tagline: string | null
  isActive: boolean
  platformFeePercent: number
  stripeAccountId: string | null
  createdAt: string
  User: {
    id: string
    name: string | null
    email: string
    role: string
  }
  _count: {
    Product: number
    StoreOrder: number
  }
}

export default function AdminStoresPage() {
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingStoreId, setDeletingStoreId] = useState<string | null>(null)

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/stores")

      if (!response.ok) {
        throw new Error("Failed to fetch stores")
      }

      const data = await response.json()
      setStores(data.stores)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteStore = async (store: Store) => {
    const confirmMessage = `Are you absolutely sure you want to delete the store "${store.name}"?\n\nThis will permanently delete:\n- ${store._count.Product} products\n- ${store._count.StoreOrder} orders\n- All product images, variants, and reviews\n- All order data\n\nThis action CANNOT be undone!`

    if (!confirm(confirmMessage)) {
      return
    }

    // Double confirmation for extra safety
    const doubleConfirm = prompt(
      `To confirm deletion, type the store name: "${store.name}"`
    )

    if (doubleConfirm !== store.name) {
      alert("Store name did not match. Deletion cancelled.")
      return
    }

    setDeletingStoreId(store.id)

    try {
      const response = await fetch(`/api/admin/stores/${store.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete store")
      }

      const data = await response.json()
      alert(
        `Successfully deleted store "${data.deletedStore.name}"!\n\n` +
        `Deleted: ${data.deletedStore.productsDeleted} products, ${data.deletedStore.ordersDeleted} orders`
      )

      // Refresh stores list
      fetchStores()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Failed to delete store"}`)
    } finally {
      setDeletingStoreId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Stores</h1>
              <p className="text-gray-600">Manage vendor stores</p>
            </div>
            <Link href="/admin" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Back to Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Stores ({stores.length})</h3>
            <p className="text-sm text-gray-600">All vendor stores on the platform</p>
          </div>
          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading stores...</p>
              </div>
            ) : stores.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No stores found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stores.map((store) => (
                  <div key={store.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/${store.slug}`} className="font-semibold text-blue-600 hover:underline text-lg">
                          {store.name}
                        </Link>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${store.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {store.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        URL: <span className="font-mono text-blue-600">stores.stepperslife.com/{store.slug}</span>
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        Owner: {store.User.name || store.User.email} ({store.User.role})
                      </p>
                      <p className="text-sm text-gray-500 mb-1">
                        Email: {store.email} {store.phone && `• Phone: ${store.phone}`}
                      </p>
                      <p className="text-sm text-gray-500 mb-1">
                        {store._count.Product} products • {store._count.StoreOrder} orders
                      </p>
                      {store.tagline && (
                        <p className="text-sm text-gray-600 italic mt-2">{store.tagline}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Created: {new Date(store.createdAt).toLocaleDateString()} •
                        Platform Fee: {store.platformFeePercent}%
                      </p>
                      {store.stripeAccountId && (
                        <p className="text-xs text-gray-400">
                          Stripe: {store.stripeAccountId}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Link
                        href={`/${store.slug}`}
                        target="_blank"
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-center whitespace-nowrap"
                      >
                        Visit Store
                      </Link>
                      <Link
                        href={`/admin/stores/${store.id}/products`}
                        className="px-3 py-1 text-sm border border-blue-500 text-blue-600 rounded hover:bg-blue-50 text-center whitespace-nowrap"
                      >
                        View Products
                      </Link>
                      <button
                        onClick={() => handleDeleteStore(store)}
                        disabled={deletingStoreId === store.id}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {deletingStoreId === store.id ? "Deleting..." : "Delete Store"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
