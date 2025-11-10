"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

type LowStockProduct = {
  id: string
  name: string
  sku: string | null
  quantity: number
  quantityAvailable: number | null
  quantityOnHold: number
  lowStockThreshold: number
  product_images: Array<{ url: string }>
}

export default function LowStockAlert() {
  const [products, setProducts] = useState<LowStockProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    fetchLowStockProducts()
  }, [])

  const fetchLowStockProducts = async () => {
    try {
      const response = await fetch("/api/dashboard/inventory/low-stock")
      const data = await response.json()

      if (data.success) {
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error("Failed to fetch low stock products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return null
  }

  if (products.length === 0 || !isVisible) {
    return null
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-yellow-800">
              Low Stock Alert
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <div className="mt-2 text-sm text-yellow-700">
            <p className="mb-2">
              {products.length} {products.length === 1 ? "product" : "products"}{" "}
              running low on stock
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {products.slice(0, 5).map((product) => {
                const available = product.quantityAvailable ?? product.quantity
                return (
                  <div
                    key={product.id}
                    className="flex items-center space-x-3 p-2 bg-white rounded border border-yellow-200"
                  >
                    {product.product_images[0] ? (
                      <img
                        src={product.product_images[0].url}
                        alt={product.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-gray-400"
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      {product.sku && (
                        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                      )}
                      <p className="text-xs text-yellow-700">
                        {available} available ({product.quantityOnHold} on hold)
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/products/${product.id}/edit`}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                    >
                      Restock →
                    </Link>
                  </div>
                )
              })}
            </div>
            {products.length > 5 && (
              <Link
                href="/dashboard/inventory"
                className="mt-3 inline-block text-sm font-medium text-yellow-800 hover:text-yellow-900"
              >
                View all {products.length} products →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
