"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { logger } from "@/lib/logger"
import toast from "react-hot-toast"
import ShippingCalculator from "./ShippingCalculator"

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

export default function CartDrawer() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [cart, setCart] = useState<Cart>({ items: [], storeSlug: null })
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState("")
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  useEffect(() => {
    const handleCartUpdated = () => {
      fetchCart()
      setIsOpen(true)
    }

    window.addEventListener("cartUpdated", handleCartUpdated)
    return () => window.removeEventListener("cartUpdated", handleCartUpdated)
  }, [])

  const fetchCart = async () => {
    try {
      setIsLoading(true)
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

  const removeItem = async (cartItemId: string) => {
    try {
      const response = await fetch("/api/cart/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cartItemId }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove item")
      }

      await fetchCart()
      toast.success("Item removed from cart")
    } catch (error) {
      logger.error("Failed to remove item:", error)
      toast.error("Failed to remove item")
    }
  }

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 10) return

    try {
      const response = await fetch("/api/cart/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cartItemId, quantity: newQuantity }),
      })

      if (!response.ok) {
        throw new Error("Failed to update quantity")
      }

      await fetchCart()
      toast.success("Cart updated")
    } catch (error) {
      logger.error("Failed to update quantity:", error)
      toast.error("Failed to update quantity")
    }
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code")
      return
    }

    if (!cart.storeSlug) {
      setCouponError("Cart is empty")
      return
    }

    setIsApplyingCoupon(true)
    setCouponError("")

    try {
      // Fetch vendor store ID from slug
      const storeResponse = await fetch(`/api/store-settings?slug=${cart.storeSlug}`)
      if (!storeResponse.ok) {
        throw new Error("Store not found")
      }
      const storeData = await storeResponse.json()

      // Prepare cart items for coupon validation
      const cartItems = cart.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || undefined,
        price: item.price,
        quantity: item.quantity,
      }))

      const response = await fetch("/api/cart/apply-coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          vendorStoreId: storeData.store.id,
          cartItems,
          subtotal: total,
          shippingCost: 0,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setCouponError(data.error || "Invalid coupon code")
        setCouponDiscount(0)
        return
      }

      setCouponDiscount(data.discountAmount || 0)
      setCouponError("")
    } catch (error) {
      logger.error("Failed to apply coupon:", error)
      setCouponError("Failed to apply coupon. Please try again.")
      setCouponDiscount(0)
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const closeDrawer = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 id="cart-title" className="text-lg font-semibold text-gray-900">
              Shopping Cart ({cart.items.length})
            </h2>
            <button
              onClick={closeDrawer}
              aria-label="Close shopping cart"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="h-5 w-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <svg
                  className="h-16 w-16 text-gray-400 mb-4"
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
                <p className="text-gray-500 font-medium">Your cart is empty</p>
                <p className="text-sm text-gray-400 mt-1">Add items to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.items.map((item, index) => (
                  <div
                    key={item.cartItemId}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg transition-all duration-300 ease-in-out hover:bg-gray-100 hover:shadow-md animate-slideIn"
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="h-16 w-16 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="h-8 w-8 text-gray-400"
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
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {item.productName}
                      </h3>
                      {item.variantName && (
                        <p className="text-xs text-gray-500">{item.variantName}</p>
                      )}
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            ${item.price.toFixed(2)}
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center border border-gray-300 rounded-md">
                            <button
                              onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="px-4 py-1 text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                              disabled={item.quantity >= 10}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.cartItemId)}
                            className="text-red-600 hover:text-red-700 text-xs font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.items.length > 0 && (
            <div className="border-t border-gray-200 p-4 space-y-4">
              {/* Shipping Calculator */}
              <div>
                <ShippingCalculator
                  cartTotal={total - couponDiscount}
                  compact={true}
                />
              </div>

              {/* Coupon Section */}
              <div className="space-y-2">
                <label htmlFor="coupon-code" className="text-sm font-medium text-gray-700">
                  Have a coupon code?
                </label>
                <div className="flex space-x-2">
                  <input
                    id="coupon-code"
                    type="text"
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value)
                      setCouponError("")
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        applyCoupon()
                      }
                    }}
                    disabled={isApplyingCoupon}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={isApplyingCoupon || !couponCode.trim()}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isApplyingCoupon ? "..." : "Apply"}
                  </button>
                </div>
                {couponError && (
                  <p className="text-sm text-red-600">{couponError}</p>
                )}
                {couponDiscount > 0 && (
                  <p className="text-sm text-green-600 font-medium">
                    Coupon applied! You saved ${couponDiscount.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Subtotal */}
              <div className="space-y-1 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="text-sm text-gray-900">
                    ${total.toFixed(2)}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Discount:</span>
                    <span className="text-sm text-green-600">
                      -${couponDiscount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-base font-medium text-gray-900">Total:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ${(total - couponDiscount).toFixed(2)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Shipping and taxes calculated at checkout
              </p>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    router.push("/checkout")
                    closeDrawer()
                  }}
                  className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Proceed to Checkout
                </button>
                <button
                  onClick={() => {
                    router.push("/cart")
                    closeDrawer()
                  }}
                  className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  View Full Cart
                </button>
                <button
                  onClick={closeDrawer}
                  className="w-full py-2 px-4 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
