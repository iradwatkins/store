"use client"

import { useState, useEffect } from "react"

type ProductPreviewModalProps = {
  productId: string | null
  onClose: () => void
  storeSlug?: string
}

type ProductDetails = {
  id: string
  name: string
  slug: string
  description: string
  category: string
  subcategory: string | null
  price: number
  compareAtPrice: number | null
  sku: string | null
  status: string
  quantity: number
  trackInventory: boolean
  images: Array<{
    id: string
    url: string
    altText: string | null
  }>
  variants: Array<{
    id: string
    name: string
    value: string
    price: number | null
    quantity: number
    sku: string | null
  }>
  _count: {
    orderItems: number
  }
}

export default function ProductPreviewModal({
  productId,
  onClose,
  storeSlug,
}: ProductPreviewModalProps) {
  const [product, setProduct] = useState<ProductDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const fetchProduct = async () => {
    if (!productId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/vendor/products/${productId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch product")
      }

      const data = await response.json()
      setProduct(data.product)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  if (!productId) return null

  const getStatusBadge = (status: string) => {
    const badges = {
      DRAFT: "bg-gray-100 text-gray-800",
      ACTIVE: "bg-green-100 text-green-800",
      OUT_OF_STOCK: "bg-red-100 text-red-800",
      ARCHIVED: "bg-yellow-100 text-yellow-800",
    }

    return (
      <span
        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          badges[status as keyof typeof badges] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.replace("_", " ")}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

        {/* Modal panel */}
        <div
          className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {isLoading && (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading product...</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-400">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {product && !isLoading && !error && (
              <div>
                {/* Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(product.status)}
                    <span className="text-sm text-gray-500">{product.category}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Images */}
                  <div>
                    {product.images.length > 0 ? (
                      <div className="space-y-4">
                        <img
                          src={product.images[0].url}
                          alt={product.images[0].altText || product.name}
                          className="w-full rounded-lg object-cover"
                        />
                        {product.images.length > 1 && (
                          <div className="grid grid-cols-4 gap-2">
                            {product.images.slice(1, 5).map((image) => (
                              <img
                                key={image.id}
                                src={image.url}
                                alt={image.altText || product.name}
                                className="w-full h-20 rounded object-cover"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    {/* Price */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Price</h4>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-gray-900">
                          ${Number(product.price).toFixed(2)}
                        </p>
                        {product.compareAtPrice && (
                          <p className="text-lg text-gray-500 line-through">
                            ${Number(product.compareAtPrice).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {product.description}
                      </p>
                    </div>

                    {/* SKU */}
                    {product.sku && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">SKU</h4>
                        <p className="text-sm text-gray-900">{product.sku}</p>
                      </div>
                    )}

                    {/* Inventory */}
                    {product.trackInventory && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Inventory</h4>
                        <p className="text-sm text-gray-900">{product.quantity} in stock</p>
                      </div>
                    )}

                    {/* Variants */}
                    {product.variants.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Variants ({product.variants.length})</h4>
                        <div className="space-y-2">
                          {product.variants.slice(0, 5).map((variant) => (
                            <div key={variant.id} className="flex justify-between items-center text-sm">
                              <span className="text-gray-900">{variant.name}</span>
                              <div className="flex items-center gap-2">
                                {variant.price && (
                                  <span className="text-gray-600">${Number(variant.price).toFixed(2)}</span>
                                )}
                                <span className="text-gray-500">{variant.quantity} in stock</span>
                              </div>
                            </div>
                          ))}
                          {product.variants.length > 5 && (
                            <p className="text-sm text-gray-500">
                              + {product.variants.length - 5} more variants
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sales */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Sales</h4>
                      <p className="text-sm text-gray-900">{product._count.orderItems} orders</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {product && !isLoading && !error && (
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
              {storeSlug && (
                <a
                  href={`/store/${storeSlug}/products/${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-500 text-base font-medium text-white hover:bg-blue-600 focus:outline-none sm:w-auto sm:text-sm"
                >
                  View on Store
                </a>
              )}
              <a
                href={`/dashboard/products/${product.id}/edit`}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:w-auto sm:text-sm"
              >
                Edit Product
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
