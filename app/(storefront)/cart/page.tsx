"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { logger } from "@/lib/logger"

type CartItem = {
  cartItemId: string
  productId: string
  productName: string
  productSlug: string
  variantId: string | null
  variantName: string | null
  price: number
  quantity: number
  image: string | null
  storeSlug: string
}

type Cart = {
  items: CartItem[]
  storeSlug: string | null
}

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart>({ items: [], storeSlug: null })
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const response = await fetch("/api/cart")
      const data = await response.json()
      setCart(data.cart || { items: [], storeSlug: null })
      setTotal(data.total || 0)
    } catch (error) {
      logger.error("Failed to fetch cart:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    setIsUpdating(true)

    try {
      const response = await fetch("/api/cart/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartItemId,
          quantity,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update cart")
      }

      await fetchCart()
    } catch {
      alert("Failed to update cart")
    } finally {
      setIsUpdating(false)
    }
  }

  const removeItem = async (cartItemId: string) => {
    if (!confirm("Remove this item from cart?")) {
      return
    }

    setIsUpdating(true)

    try {
      const response = await fetch("/api/cart/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartItemId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove item")
      }

      await fetchCart()
    } catch {
      alert("Failed to remove item")
    } finally {
      setIsUpdating(false)
    }
  }

  const clearCart = async () => {
    if (!confirm("Clear all items from cart?")) {
      return
    }

    setIsUpdating(true)

    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to clear cart")
      }

      await fetchCart()
    } catch {
      alert("Failed to clear cart")
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading cart...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {cart.items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h3>
            <p className="mt-2 text-gray-500">Start shopping to add items to your cart</p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
            {/* Cart Items */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-lg shadow">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">
                    {cart.items.length} {cart.items.length === 1 ? "Item" : "Items"}
                  </h2>
                  <button
                    onClick={clearCart}
                    disabled={isUpdating}
                    className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    Clear Cart
                  </button>
                </div>

                <ul className="divide-y divide-gray-200">
                  {cart.items.map((item) => (
                    <li key={item.cartItemId} className="px-4 py-6 sm:px-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.productName}
                              className="h-24 w-24 rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-24 w-24 rounded-md bg-gray-200 flex items-center justify-center">
                              <svg
                                className="h-12 w-12 text-gray-400"
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

                        <div className="ml-6 flex-1">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="text-base font-medium text-gray-900">
                                <a
                                  href={`/store/${item.storeSlug}/products/${item.productSlug}`}
                                  className="hover:text-blue-500"
                                >
                                  {item.productName}
                                </a>
                              </h3>
                              {item.variantName && (
                                <p className="mt-1 text-sm text-gray-500">
                                  {item.variantName}
                                </p>
                              )}
                            </div>
                            <p className="text-base font-medium text-gray-900">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  updateQuantity(item.cartItemId, Math.max(1, item.quantity - 1))
                                }
                                disabled={isUpdating || item.quantity <= 1}
                                className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="text-gray-700 w-12 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.cartItemId, Math.min(10, item.quantity + 1))
                                }
                                disabled={isUpdating || item.quantity >= 10}
                                className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.cartItemId)}
                              disabled={isUpdating}
                              className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>

                          <p className="mt-2 text-sm text-gray-500">
                            Subtotal: ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <a
                  href={cart.storeSlug ? `/store/${cart.storeSlug}` : "/"}
                  className="text-blue-500 hover:text-blue-400"
                >
                  &larr; Continue Shopping
                </a>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-5 mt-8 lg:mt-0">
              <div className="bg-white rounded-lg shadow p-6 sticky top-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>

                <div className="space-y-3">
                  <div className="flex justify-between text-base text-gray-900">
                    <p>Subtotal</p>
                    <p>${total.toFixed(2)}</p>
                  </div>

                  <div className="flex justify-between text-base text-gray-900">
                    <p>Shipping</p>
                    <p className="text-gray-500">Calculated at checkout</p>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-medium text-gray-900">
                      <p>Total</p>
                      <p>${total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => router.push("/checkout")}
                    className="w-full px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-500 hover:bg-blue-600"
                  >
                    Proceed to Checkout
                  </button>
                </div>

                <p className="mt-4 text-sm text-gray-500 text-center">
                  Secure checkout powered by Stripe
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
