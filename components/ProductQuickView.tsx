"use client"

import { useState, useEffect } from "react"
import { logger } from "@/lib/logger"
import toast from "react-hot-toast"

type ProductImage = {
  id: string
  url: string
  altText: string | null
  sortOrder: number
}

type VariantCombination = {
  id: string
  sku: string | null
  price: number
  compareAtPrice: number | null
  quantity: number | null
  available: boolean
  combinationKey: string
  optionValues: Record<string, string>
  imageUrl: string | null
}

type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  compareAtPrice: number | null
  quantity: number | null
  category: string | null
  trackInventory: boolean
  product_images: ProductImage[]
  variantCombinations: VariantCombination[]
  vendor_stores: {
    slug: string
    name: string
  }
}

interface ProductQuickViewProps {
  isOpen: boolean
  onClose: () => void
  productId: string
}

export default function ProductQuickView({ isOpen, onClose, productId }: ProductQuickViewProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  useEffect(() => {
    if (isOpen && productId) {
      fetchProduct()
    }
  }, [isOpen, productId])

  const fetchProduct = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/products/${productId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch product")
      }
      const data = await response.json()
      setProduct(data.product)

      // Auto-select first available variant if exists
      if (data.product.variantCombinations?.length > 0) {
        const firstAvailable = data.product.variantCombinations.find((v: VariantCombination) => v.available)
        if (firstAvailable) {
          setSelectedVariant(firstAvailable.id)
        }
      }
    } catch (error) {
      logger.error("Failed to fetch product:", error)
      toast.error("Failed to load product")
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return

    setIsAddingToCart(true)
    try {
      const body: any = {
        productId: product.id,
        quantity,
        storeSlug: product.vendor_stores.slug,
      }

      if (product.variantCombinations.length > 0) {
        if (!selectedVariant) {
          toast.error("Please select a variant")
          return
        }
        body.variantCombinationId = selectedVariant
      }

      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === "different_store") {
          toast.error(data.message || "You can only add items from one store at a time")
        } else {
          toast.error(data.error || "Failed to add to cart")
        }
        return
      }

      toast.success("Added to cart!")
      window.dispatchEvent(new Event("cartUpdated"))
      onClose()
    } catch (error) {
      logger.error("Failed to add to cart:", error)
      toast.error("Failed to add to cart")
    } finally {
      setIsAddingToCart(false)
    }
  }

  if (!isOpen) return null

  const selectedVariantData = product?.variantCombinations.find((v) => v.id === selectedVariant)
  const displayPrice = selectedVariantData?.price ?? product?.price ?? 0
  const displayComparePrice = selectedVariantData?.compareAtPrice ?? product?.compareAtPrice
  const currentImage = product?.product_images[selectedImage]?.url || selectedVariantData?.imageUrl || "/placeholder.png"

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
              aria-label="Close quick view"
            >
              <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : product ? (
              <div className="grid md:grid-cols-2 gap-6 p-6 overflow-y-auto max-h-[90vh]">
                {/* Left: Images */}
                <div className="space-y-4">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={currentImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {product.product_images.length > 1 && (
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      {product.product_images.map((image, index) => (
                        <button
                          key={image.id}
                          onClick={() => setSelectedImage(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                            selectedImage === index ? "border-blue-600" : "border-gray-200"
                          }`}
                        >
                          <img
                            src={image.url}
                            alt={image.altText || `${product.name} thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Product Details */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      by {product.vendor_stores.name}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl font-bold text-gray-900">
                      ${displayPrice.toFixed(2)}
                    </span>
                    {displayComparePrice && displayComparePrice > displayPrice && (
                      <span className="text-lg text-gray-500 line-through">
                        ${displayComparePrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {product.description && (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-600">{product.description}</p>
                    </div>
                  )}

                  {/* Variant Selection */}
                  {product.variantCombinations.length > 0 && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Select Options
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {product.variantCombinations.map((variant) => {
                          const optionDisplay = Object.entries(variant.optionValues)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(", ")
                          return (
                            <button
                              key={variant.id}
                              onClick={() => setSelectedVariant(variant.id)}
                              disabled={!variant.available}
                              className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                                selectedVariant === variant.id
                                  ? "border-blue-600 bg-blue-50 text-blue-700"
                                  : variant.available
                                  ? "border-gray-300 hover:border-gray-400"
                                  : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              {optionDisplay}
                              {!variant.available && (
                                <span className="block text-xs mt-1">Out of Stock</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Quantity
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-md w-32">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center font-medium">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(10, quantity + 1))}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-4">
                    <button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart || (product.variantCombinations.length > 0 && !selectedVariant)}
                      className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAddingToCart ? "Adding..." : "Add to Cart"}
                    </button>
                    <a
                      href={`/store/${product.vendor_stores.slug}/products/${product.slug}`}
                      className="block w-full py-3 px-6 border border-gray-300 text-gray-700 font-semibold rounded-lg text-center hover:bg-gray-50 transition-colors"
                    >
                      View Full Details
                    </a>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
