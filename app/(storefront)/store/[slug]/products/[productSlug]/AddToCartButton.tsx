"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Variant = {
  id: string
  type: string
  name: string
  price: number | null
  inventoryQuantity: number | null
}

type Addon = {
  id: string
  name: string
  description: string | null
  price: number
  fieldType: string
  priceType: string
  isRequired: boolean
  allowMultiple: boolean
  maxQuantity: number | null
  options: any
  minValue: number | null
  maxValue: number | null
}

type Product = {
  id: string
  name: string
  price: number
  slug: string
  image?: string
  trackInventory: boolean
  inventoryQuantity: number | null
}

type CartSwitchInfo = {
  currentCart: {
    storeSlug: string
    storeName: string
    itemCount: number
    total: number
  }
  attemptedStore: {
    storeSlug: string
    storeName: string
  }
}

export default function AddToCartButton({
  product,
  variants,
  addons = [],
  storeSlug,
}: {
  product: Product
  variants: Variant[]
  addons?: Addon[]
  storeSlug: string
}) {
  const router = useRouter()
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    variants.length > 0 ? variants[0].id : null
  )
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  )
  const [showCartSwitchModal, setShowCartSwitchModal] = useState(false)
  const [cartSwitchInfo, setCartSwitchInfo] = useState<CartSwitchInfo | null>(null)

  // Addon selections state: { [addonId]: value }
  const [addonSelections, setAddonSelections] = useState<Record<string, any>>({})


  const hasVariants = variants.length > 0
  const selectedVariantData = hasVariants
    ? variants.find((v) => v.id === selectedVariant)
    : null

  const currentPrice = selectedVariantData?.price || product.price
  const currentInventory = hasVariants
    ? selectedVariantData?.inventoryQuantity
    : product.inventoryQuantity

  const maxQuantity = product.trackInventory && currentInventory !== null
    ? Math.min(currentInventory, 10)
    : 10

  const isOutOfStock =
    product.trackInventory && currentInventory !== null && currentInventory <= 0

  // Calculate addon prices
  const calculateAddonPrice = () => {
    let addonTotal = 0
    addons.forEach(addon => {
      const selection = addonSelections[addon.id]
      if (!selection) {return}

      if (addon.priceType === 'FIXED') {
        addonTotal += addon.price
      } else if (addon.priceType === 'PERCENTAGE') {
        addonTotal += (currentPrice * addon.price) / 100
      }
      // FORMULA type would need custom evaluation logic
    })
    return addonTotal
  }

  const addonPrice = calculateAddonPrice()
  const totalPrice = (currentPrice + addonPrice) * quantity

  const handleAddToCart = async () => {
    // Validate required addons
    const missingRequired = addons.filter(
      addon => addon.isRequired && !addonSelections[addon.id]
    )
    if (missingRequired.length > 0) {
      setMessage({
        type: "error",
        text: `Please select: ${missingRequired.map(a => a.name).join(', ')}`
      })
      return
    }

    setIsAdding(true)
    setMessage(null)

    try {
      // Transform addons from object to array format
      const addonsArray = Object.entries(addonSelections)
        .filter(([_, value]) => value)
        .map(([addonId, value]) => ({
          addonId,
          quantity: typeof value === 'number' ? value : 1,
        }))

      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant,
          quantity,
          storeSlug,
          addons: addonsArray.length > 0 ? addonsArray : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Check if it's a different store error
        if (result.error === "different_store" && result.currentCart && result.attemptedStore) {
          setCartSwitchInfo({
            currentCart: result.currentCart,
            attemptedStore: result.attemptedStore,
          })
          setShowCartSwitchModal(true)
          setIsAdding(false)
          return
        }

        throw new Error(result.error || "Failed to add to cart")
      }

      setMessage({ type: "success", text: "Added to cart!" })

      // Refresh cart count
      window.dispatchEvent(new Event("cartUpdated"))

      // Reset message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong",
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleClearAndAdd = async () => {
    setIsAdding(true)
    setShowCartSwitchModal(false)

    try {
      // Clear the cart
      const clearResponse = await fetch("/api/cart", {
        method: "DELETE",
      })

      if (!clearResponse.ok) {
        throw new Error("Failed to clear cart")
      }

      // Transform addons from object to array format
      const addonsArray = Object.entries(addonSelections)
        .filter(([_, value]) => value)
        .map(([addonId, value]) => ({
          addonId,
          quantity: typeof value === 'number' ? value : 1,
        }))

      // Add the new item
      const addResponse = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant,
          quantity,
          storeSlug,
          addons: addonsArray.length > 0 ? addonsArray : undefined,
        }),
      })

      const result = await addResponse.json()

      if (!addResponse.ok) {
        throw new Error(result.error || "Failed to add to cart")
      }

      setMessage({ type: "success", text: "Cart cleared. Item added!" })

      // Refresh cart count
      window.dispatchEvent(new Event("cartUpdated"))

      // Reset message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong",
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Variant Selection */}
        {hasVariants && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select {variants[0].type === "SIZE" ? "Size" : "Color"}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {variants.map((variant) => {
                const variantOutOfStock =
                  product.trackInventory &&
                  variant.inventoryQuantity !== null &&
                  variant.inventoryQuantity <= 0

                return (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant.id)}
                    disabled={variantOutOfStock}
                    className={`px-4 py-2 text-sm font-medium rounded-md border ${
                      selectedVariant === variant.id
                        ? "border-blue-600 bg-blue-50 text-blue-500"
                        : variantOutOfStock
                        ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {variant.name}
                    {variant.price && (
                      <span className="block text-xs mt-1">
                        ${variant.price.toFixed(2)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Product Addons */}
        {addons.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Customize Your Product</h3>
            {addons.map(addon => (
              <div key={addon.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">
                      {addon.name}
                      {addon.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {addon.description && (
                      <p className="text-xs text-gray-500 mt-1">{addon.description}</p>
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {addon.priceType === 'PERCENTAGE' ? `+${addon.price}%` : `+$${addon.price.toFixed(2)}`}
                  </div>
                </div>

                {/* Render different input types based on fieldType */}
                {addon.fieldType === 'TEXT' && (
                  <input
                    type="text"
                    value={addonSelections[addon.id] || ''}
                    onChange={(e) => setAddonSelections({ ...addonSelections, [addon.id]: e.target.value })}
                    placeholder={`Enter ${addon.name.toLowerCase()}`}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                )}

                {addon.fieldType === 'TEXTAREA' && (
                  <textarea
                    value={addonSelections[addon.id] || ''}
                    onChange={(e) => setAddonSelections({ ...addonSelections, [addon.id]: e.target.value })}
                    placeholder={`Enter ${addon.name.toLowerCase()}`}
                    rows={3}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                )}

                {addon.fieldType === 'NUMBER' && (
                  <input
                    type="number"
                    value={addonSelections[addon.id] || ''}
                    onChange={(e) => setAddonSelections({ ...addonSelections, [addon.id]: e.target.value })}
                    min={addon.minValue || undefined}
                    max={addon.maxValue || undefined}
                    placeholder={`Enter ${addon.name.toLowerCase()}`}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                )}

                {addon.fieldType === 'SELECT' && addon.options && (
                  <select
                    value={addonSelections[addon.id] || ''}
                    onChange={(e) => setAddonSelections({ ...addonSelections, [addon.id]: e.target.value })}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Select an option...</option>
                    {addon.options.map((opt: any, idx: number) => (
                      <option key={idx} value={opt.value}>
                        {opt.label} {opt.price ? `(+$${opt.price})` : ''}
                      </option>
                    ))}
                  </select>
                )}

                {addon.fieldType === 'RADIO' && addon.options && (
                  <div className="mt-2 space-y-2">
                    {addon.options.map((opt: any, idx: number) => (
                      <label key={idx} className="flex items-center">
                        <input
                          type="radio"
                          name={`addon-${addon.id}`}
                          value={opt.value}
                          checked={addonSelections[addon.id] === opt.value}
                          onChange={(e) => setAddonSelections({ ...addonSelections, [addon.id]: e.target.value })}
                          className="h-4 w-4 text-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {opt.label} {opt.price ? `(+$${opt.price})` : ''}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {addon.fieldType === 'CHECKBOX' && (
                  <label className="mt-2 flex items-center">
                    <input
                      type="checkbox"
                      checked={!!addonSelections[addon.id]}
                      onChange={(e) => setAddonSelections({ ...addonSelections, [addon.id]: e.target.checked })}
                      className="h-4 w-4 text-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Yes, add this option
                    </span>
                  </label>
                )}

                {addon.fieldType === 'DATE' && (
                  <input
                    type="date"
                    value={addonSelections[addon.id] || ''}
                    onChange={(e) => setAddonSelections({ ...addonSelections, [addon.id]: e.target.value })}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                )}

                {addon.fieldType === 'COLOR' && (
                  <div className="mt-2 flex items-center space-x-3">
                    <input
                      type="color"
                      value={addonSelections[addon.id] || '#000000'}
                      onChange={(e) => setAddonSelections({ ...addonSelections, [addon.id]: e.target.value })}
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">{addonSelections[addon.id] || 'No color selected'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quantity Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <input
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))
              }
              className="w-20 text-center border-gray-300 rounded-md"
            />
            <button
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              disabled={quantity >= maxQuantity}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          {product.trackInventory && currentInventory !== null && (
            <p className="mt-2 text-sm text-gray-500">
              {currentInventory > 0
                ? `${currentInventory} available`
                : "Out of stock"}
            </p>
          )}
        </div>

        {/* Price Summary */}
        <div className="border-t border-gray-200 pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Product Price:</span>
              <span>${currentPrice.toFixed(2)}</span>
            </div>
            {addonPrice > 0 && (
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Add-ons:</span>
                <span>+${addonPrice.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Quantity:</span>
              <span>×{quantity}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
              <span>Total:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={isAdding || isOutOfStock}
          className="w-full py-3 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding
            ? "Adding to Cart..."
            : isOutOfStock
            ? "Out of Stock"
            : "Add to Cart"}
        </button>

        {/* Message */}
        {message && (
          <div
            className={`rounded-md p-4 ${
              message.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}
      </div>

      {/* Cart Switch Modal */}
      <AlertDialog open={showCartSwitchModal} onOpenChange={setShowCartSwitchModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ready to shop at {cartSwitchInfo?.attemptedStore.storeName}?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You have <span className="font-semibold">{cartSwitchInfo?.currentCart.itemCount} {cartSwitchInfo?.currentCart.itemCount === 1 ? 'item' : 'items'}</span>{" "}
                (${cartSwitchInfo?.currentCart.total.toFixed(2)}) from{" "}
                <span className="font-semibold">{cartSwitchInfo?.currentCart.storeName}</span> in your cart.
              </p>
              <p className="text-sm">
                Our marketplace policy allows items from one store per checkout. To continue shopping at{" "}
                <span className="font-semibold">{cartSwitchInfo?.attemptedStore.storeName}</span>, you can:
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setShowCartSwitchModal(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push('/cart')}
              className="bg-gray-600 hover:bg-gray-700"
            >
              View Current Cart
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleClearAndAdd}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Clear Cart & Shop Here
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
