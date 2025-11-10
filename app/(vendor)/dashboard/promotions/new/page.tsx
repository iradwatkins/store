"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { logger } from "@/lib/logger"
import toast from "react-hot-toast"

type Product = {
  id: string
  name: string
  slug: string
  price: number
  product_images: Array<{ url: string }>
}

export default function NewPromotionPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    type: "ORDER_BUMP",
    title: "",
    description: "",
    productId: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    freeShipping: false,
    status: "ACTIVE",
    priority: 50,
    minCartAmount: 0,
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/vendor/products?status=ACTIVE")
      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      logger.error("Failed to fetch products:", error)
      toast.error("Failed to load products")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.productId) {
      toast.error("Please select a product")
      return
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a title")
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        type: formData.type,
        title: formData.title,
        description: formData.description || undefined,
        productId: formData.productId,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        freeShipping: formData.freeShipping,
        status: formData.status,
        priority: Number(formData.priority),
        conditions: {
          minCartAmount: formData.minCartAmount > 0 ? Number(formData.minCartAmount) : undefined,
        },
      }

      const response = await fetch("/api/vendor/promotions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create promotion")
      }

      toast.success("Promotion created successfully!")
      router.push("/dashboard/promotions")
    } catch (error: any) {
      logger.error("Failed to create promotion:", error)
      toast.error(error.message || "Failed to create promotion")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-primary hover:text-primary/80 mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Promotions
          </button>
          <h1 className="text-3xl font-bold text-foreground">Create New Promotion</h1>
          <p className="text-muted-foreground mt-1">
            Set up an order bump to increase your average order value
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-6">
          {/* Promotion Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Promotion Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ORDER_BUMP">Order Bump (shown at checkout)</option>
              <option value="UPSELL">Upsell (after purchase)</option>
              <option value="CROSS_SELL">Cross-sell (related products)</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Add matching accessories for 20% off!"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe why customers should add this to their order..."
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Product *
            </label>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading products...</div>
            ) : (
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Choose a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ${product.price.toFixed(2)}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              This product will be offered at a discount
            </p>
          </div>

          {/* Discount Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Discount Type
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="PERCENTAGE">Percentage Off</option>
                <option value="FIXED">Fixed Amount Off</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Discount Value
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                  min="0"
                  step={formData.discountType === "PERCENTAGE" ? "1" : "0.01"}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                <span className="absolute right-4 top-2 text-muted-foreground">
                  {formData.discountType === "PERCENTAGE" ? "%" : "$"}
                </span>
              </div>
            </div>
          </div>

          {/* Free Shipping */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="freeShipping"
              checked={formData.freeShipping}
              onChange={(e) => setFormData({ ...formData, freeShipping: e.target.checked })}
              className="h-4 w-4 text-primary border-border rounded focus:ring-primary"
            />
            <label htmlFor="freeShipping" className="ml-2 text-sm text-foreground">
              Include free shipping with this offer
            </label>
          </div>

          {/* Conditions */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Minimum Cart Amount (optional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-muted-foreground">$</span>
              <input
                type="number"
                value={formData.minCartAmount}
                onChange={(e) => setFormData({ ...formData, minCartAmount: Number(e.target.value) })}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Only show this offer when cart total is above this amount (0 = no minimum)
            </p>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Priority (0-100)
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1">Higher priority shows first</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Promotion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
