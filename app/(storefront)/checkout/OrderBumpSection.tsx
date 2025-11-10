"use client"

import { useState, useEffect } from "react"
import toast from "react-hot-toast"

type OrderBump = {
  id: string
  title: string
  description: string | null
  product: {
    id: string
    name: string
    slug: string
    description: string | null
    originalPrice: number
    finalPrice: number
    compareAtPrice: number | null
    image: string | null
  }
  discountType: string
  discountValue: number
  freeShipping: boolean
  savings: number
}

type CartItem = {
  productId: string
  price: number
  quantity: number
}

interface OrderBumpSectionProps {
  storeSlug: string
  cartItems: CartItem[]
  cartTotal: number
  onBumpAdded: () => void
}

export default function OrderBumpSection({
  storeSlug,
  cartItems,
  cartTotal,
  onBumpAdded,
}: OrderBumpSectionProps) {
  const [orderBumps, setOrderBumps] = useState<OrderBump[]>([])
  const [selectedBumps, setSelectedBumps] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingToCart, setIsAddingToCart] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchOrderBumps()
  }, [storeSlug, cartTotal])

  const fetchOrderBumps = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/checkout/order-bumps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeSlug,
          cartItems,
          cartTotal,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch order bumps")
      }

      const data = await response.json()
      setOrderBumps(data.orderBumps || [])
    } catch (error) {
      console.error("Failed to fetch order bumps:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = async (bump: OrderBump) => {
    setIsAddingToCart((prev) => new Set(prev).add(bump.id))

    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: bump.product.id,
          quantity: 1,
          storeSlug,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add to cart")
      }

      // Track bump acceptance with product price for revenue tracking
      await fetch(`/api/vendor/promotions/${bump.id}/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "accepted",
          productPrice: bump.product.price
        }),
      }).catch(() => {}) // Silent fail on analytics

      setSelectedBumps((prev) => new Set(prev).add(bump.id))
      toast.success("Added to cart!")
      onBumpAdded()
    } catch (error: any) {
      console.error("Failed to add bump to cart:", error)
      toast.error(error.message || "Failed to add to cart")
    } finally {
      setIsAddingToCart((prev) => {
        const newSet = new Set(prev)
        newSet.delete(bump.id)
        return newSet
      })
    }
  }

  if (isLoading) {
    return null
  }

  if (orderBumps.length === 0) {
    return null
  }

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
        <svg
          className="w-5 h-5 mr-2 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
          />
        </svg>
        Recommended Add-Ons
      </h3>

      {orderBumps.map((bump) => {
        const isSelected = selectedBumps.has(bump.id)
        const isAdding = isAddingToCart.has(bump.id)

        return (
          <div
            key={bump.id}
            className={`border-2 rounded-lg p-4 transition-all ${
              isSelected
                ? "border-green-500 bg-green-50"
                : "border-gray-200 bg-white hover:border-blue-300"
            }`}
          >
            <div className="flex items-start space-x-4">
              {/* Product Image */}
              {bump.product.image ? (
                <img
                  src={bump.product.image}
                  alt={bump.product.name}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Badge */}
                <div className="flex items-center space-x-2 mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {bump.freeShipping && "Free Shipping + "}
                    Save ${bump.savings.toFixed(2)}
                  </span>
                </div>

                {/* Title & Description */}
                <h4 className="font-semibold text-gray-900 mb-1">{bump.title}</h4>
                {bump.description && (
                  <p className="text-sm text-gray-600 mb-2">{bump.description}</p>
                )}

                {/* Product Name */}
                <p className="text-sm text-gray-700 mb-2">
                  <strong>{bump.product.name}</strong>
                </p>

                {/* Pricing */}
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg font-bold text-gray-900">
                    ${bump.product.finalPrice.toFixed(2)}
                  </span>
                  {bump.product.originalPrice > bump.product.finalPrice && (
                    <span className="text-sm text-gray-500 line-through">
                      ${bump.product.originalPrice.toFixed(2)}
                    </span>
                  )}
                  {bump.freeShipping && (
                    <span className="text-xs font-medium text-green-600">+ Free Shipping</span>
                  )}
                </div>

                {/* Add Button */}
                {isSelected ? (
                  <div className="flex items-center text-green-700 font-medium">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Added to cart!
                  </div>
                ) : (
                  <button
                    onClick={() => handleAddToCart(bump)}
                    disabled={isAdding}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdding ? "Adding..." : "Yes, Add to My Order"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
