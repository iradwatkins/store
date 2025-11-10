"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { logger } from "@/lib/logger"
import toast from "react-hot-toast"
import Link from "next/link"

type Promotion = {
  id: string
  type: string
  title: string
  description: string | null
  discountType: string
  discountValue: number
  freeShipping: boolean
  status: string
  priority: number
  displayCount: number
  acceptedCount: number
  revenueAdded: number
  createdAt: string
  products: {
    id: string
    name: string
    slug: string
    price: number
    product_images: Array<{ url: string }>
  }
}

export default function PromotionsPage() {
  const router = useRouter()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    fetchPromotions()
  }, [filter])

  const fetchPromotions = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== "all") {
        params.set("status", filter)
      }

      const response = await fetch(`/api/vendor/promotions?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch promotions")
      }

      const data = await response.json()
      setPromotions(data.promotions || [])
    } catch (error) {
      logger.error("Failed to fetch promotions:", error)
      toast.error("Failed to load promotions")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"
      const response = await fetch(`/api/vendor/promotions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update promotion")
      }

      toast.success(`Promotion ${newStatus === "ACTIVE" ? "activated" : "deactivated"}`)
      fetchPromotions()
    } catch (error) {
      logger.error("Failed to toggle promotion:", error)
      toast.error("Failed to update promotion")
    }
  }

  const deletePromotion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promotion?")) {
      return
    }

    try {
      const response = await fetch(`/api/vendor/promotions/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete promotion")
      }

      toast.success("Promotion deleted")
      fetchPromotions()
    } catch (error) {
      logger.error("Failed to delete promotion:", error)
      toast.error("Failed to delete promotion")
    }
  }

  const calculateConversionRate = (promo: Promotion) => {
    if (promo.displayCount === 0) return 0
    return ((promo.acceptedCount / promo.displayCount) * 100).toFixed(1)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Order Bumps & Promotions</h1>
            <p className="text-muted-foreground mt-1">
              Boost your average order value with strategic offers
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/promotions/new")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Create Promotion
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Promotions</p>
            <p className="text-2xl font-bold text-foreground">{promotions.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {promotions.filter((p) => p.status === "ACTIVE").length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Revenue Added</p>
            <p className="text-2xl font-bold text-foreground">
              ${promotions.reduce((sum, p) => sum + p.revenueAdded, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Avg. Conversion</p>
            <p className="text-2xl font-bold text-foreground">
              {promotions.length > 0
                ? (
                    promotions.reduce((sum, p) => {
                      const rate = p.displayCount > 0 ? (p.acceptedCount / p.displayCount) * 100 : 0
                      return sum + rate
                    }, 0) / promotions.length
                  ).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex space-x-2 border-b border-border">
          {["all", "ACTIVE", "INACTIVE"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === status
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {status === "all" ? "All" : status === "ACTIVE" ? "Active" : "Inactive"}
            </button>
          ))}
        </div>

        {/* Promotions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : promotions.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground mb-4"
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
            <h3 className="text-lg font-medium text-foreground mb-2">No promotions yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first order bump to increase sales
            </p>
            <button
              onClick={() => router.push("/dashboard/promotions/new")}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Create Promotion
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex space-x-4 flex-1">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {promo.products.product_images.length > 0 ? (
                        <img
                          src={promo.products.product_images[0].url}
                          alt={promo.products.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                          <span className="text-muted-foreground text-xs">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Promotion Details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{promo.title}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            promo.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {promo.status}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {promo.type.replace("_", " ")}
                        </span>
                      </div>
                      {promo.description && (
                        <p className="text-sm text-muted-foreground mb-2">{promo.description}</p>
                      )}
                      <p className="text-sm text-foreground mb-3">
                        Product: <span className="font-medium">{promo.products.name}</span>
                      </p>

                      {/* Discount Info */}
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-foreground">
                          <strong>Discount:</strong>{" "}
                          {promo.discountType === "PERCENTAGE"
                            ? `${promo.discountValue}% off`
                            : `$${promo.discountValue.toFixed(2)} off`}
                        </span>
                        {promo.freeShipping && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            Free Shipping
                          </span>
                        )}
                        <span className="text-muted-foreground">Priority: {promo.priority}</span>
                      </div>

                      {/* Analytics */}
                      <div className="mt-3 flex items-center space-x-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Shown:</span>
                          <span className="font-medium text-foreground ml-1">{promo.displayCount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Accepted:</span>
                          <span className="font-medium text-foreground ml-1">{promo.acceptedCount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Conversion:</span>
                          <span className="font-medium text-foreground ml-1">
                            {calculateConversionRate(promo)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Revenue:</span>
                          <span className="font-medium text-green-600 ml-1">
                            ${promo.revenueAdded.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => toggleStatus(promo.id, promo.status)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        promo.status === "ACTIVE"
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          : "bg-green-100 text-green-800 hover:bg-green-200"
                      }`}
                    >
                      {promo.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/promotions/${promo.id}/edit`)}
                      className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePromotion(promo.id)}
                      className="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
