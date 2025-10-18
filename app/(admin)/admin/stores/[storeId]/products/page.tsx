"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

type Product = {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice: number | null
  sku: string | null
  quantity: number
  category: string
  status: string
  hasVariants: boolean
  createdAt: string
  images: {
    id: string
    url: string
    altText: string | null
  }[]
  variants: {
    id: string
    name: string
    value: string
    quantity: number
    available: boolean
  }[]
  _count: {
    images: number
    variants: number
    reviews: number
    orderItems: number
  }
}

type Store = {
  id: string
  name: string
  slug: string
}

export default function AdminStoreProductsPage() {
  const router = useRouter()
  const params = useParams()
  const storeId = params.storeId as string

  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [togglingStatusProductId, setTogglingStatusProductId] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [storeId])

  const fetchProducts = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/stores/${storeId}/products`)

      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }

      const data = await response.json()
      setStore(data.store)
      setProducts(data.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProduct = async (product: Product) => {
    const confirmMessage = `Are you sure you want to delete "${product.name}"?\n\nThis will permanently delete:\n- ${product._count.variants} variants\n- ${product._count.images} images\n- ${product._count.reviews} reviews\n- ${product._count.orderItems} order references\n\nThis action CANNOT be undone!`

    if (!confirm(confirmMessage)) {
      return
    }

    setDeletingProductId(product.id)

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete product")
      }

      const data = await response.json()
      alert(
        `Successfully deleted "${data.deletedProduct.name}"!\n\n` +
        `Deleted: ${data.deletedProduct.variantsDeleted} variants, ${data.deletedProduct.imagesDeleted} images, ${data.deletedProduct.reviewsDeleted} reviews`
      )

      // Refresh products list
      fetchProducts()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Failed to delete product"}`)
    } finally {
      setDeletingProductId(null)
    }
  }

  const handleStatusToggle = async (product: Product) => {
    // Determine next status (DRAFT ↔ ACTIVE)
    const newStatus = product.status === "DRAFT" ? "ACTIVE" : product.status === "ACTIVE" ? "DRAFT" : product.status

    if (newStatus === product.status) {
      alert("Can only toggle between DRAFT and ACTIVE status")
      return
    }

    setTogglingStatusProductId(product.id)

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update status")
      }

      // Refresh products list
      fetchProducts()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Failed to update status"}`)
    } finally {
      setTogglingStatusProductId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      DRAFT: "bg-gray-100 text-gray-800",
      ACTIVE: "bg-green-100 text-green-800",
      OUT_OF_STOCK: "bg-red-100 text-red-800",
      ARCHIVED: "bg-yellow-100 text-yellow-800",
    }

    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded ${
          badges[status as keyof typeof badges] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.replace("_", " ")}
      </span>
    )
  }

  const getTotalInventory = (product: Product) => {
    if (product.hasVariants && product.variants.length > 0) {
      return product.variants.reduce((sum, variant) => sum + variant.quantity, 0)
    }
    return product.quantity
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {store ? `${store.name} - Products` : "Store Products"}
              </h1>
              <p className="text-gray-600">Manage products for this store</p>
            </div>
            <div className="flex gap-2">
              {store && (
                <Link
                  href={`/${store.slug}`}
                  target="_blank"
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Visit Store
                </Link>
              )}
              <Link href="/admin/stores" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Back to Stores
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Products ({products.length})</h3>
            <p className="text-sm text-gray-600">All products in this store</p>
          </div>
          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found in this store</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inventory
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stats
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              {product.images[0] ? (
                                <img
                                  className="h-12 w-12 rounded object-cover"
                                  src={product.images[0].url}
                                  alt={product.images[0].altText || product.name}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
                                  <svg
                                    className="h-6 w-6 text-gray-400"
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
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              {product.sku && (
                                <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                              )}
                              {product.hasVariants && (
                                <div className="text-xs text-blue-600">{product._count.variants} variants</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${Number(product.price).toFixed(2)}</div>
                          {product.compareAtPrice && (
                            <div className="text-xs text-gray-500 line-through">
                              ${Number(product.compareAtPrice).toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getTotalInventory(product)}</div>
                          {product.hasVariants && (
                            <div className="text-xs text-gray-500">across variants</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleStatusToggle(product)}
                            disabled={togglingStatusProductId === product.id || (product.status !== "DRAFT" && product.status !== "ACTIVE")}
                            className="disabled:cursor-not-allowed"
                            title={(product.status === "DRAFT" || product.status === "ACTIVE") ? "Click to toggle status" : "Cannot toggle this status"}
                          >
                            {getStatusBadge(product.status)}
                            {togglingStatusProductId === product.id && (
                              <span className="ml-2 inline-block">
                                <svg className="animate-spin h-4 w-4 inline" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{product._count.orderItems} sales</div>
                          <div>{product._count.reviews} reviews</div>
                          <div>{product._count.images} images</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {/* View on Store */}
                            {store && (
                              <Link
                                href={`/${store.slug}/products/${product.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-blue-600 transition-colors"
                                title="View on Store"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </Link>
                            )}

                            {/* Edit */}
                            <button
                              onClick={() => {
                                // For now, navigate to vendor edit page - admin can edit through vendor interface
                                // In the future, create dedicated admin edit page
                                router.push(`/dashboard/products/${product.id}/edit`)
                              }}
                              className="text-gray-600 hover:text-blue-600 transition-colors"
                              title="Edit Product"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              disabled={deletingProductId === product.id}
                              className="text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={deletingProductId === product.id ? "Deleting..." : "Delete"}
                            >
                              {deletingProductId === product.id ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
