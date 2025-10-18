"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

type Product = {
  id: string
  name: string
  slug: string
  price: number
  category: string | null
  image: string | null
  storeName: string
  storeSlug: string
}

const CATEGORIES = [
  { value: "ACCESSORIES", label: "Accessories" },
  { value: "ART_AND_COLLECTIBLES", label: "Art & Collectibles" },
  { value: "BAGS_AND_PURSES", label: "Bags & Purses" },
  { value: "BATH_AND_BEAUTY", label: "Bath & Beauty" },
  { value: "BOOKS_MOVIES_AND_MUSIC", label: "Books, Movies & Music" },
  { value: "CLOTHING", label: "Clothing" },
  { value: "CRAFT_SUPPLIES_AND_TOOLS", label: "Craft Supplies & Tools" },
  { value: "ELECTRONICS_AND_ACCESSORIES", label: "Electronics & Accessories" },
  { value: "HOME_AND_LIVING", label: "Home & Living" },
  { value: "JEWELRY", label: "Jewelry" },
  { value: "PAPER_AND_PARTY_SUPPLIES", label: "Paper & Party Supplies" },
  { value: "PET_SUPPLIES", label: "Pet Supplies" },
  { value: "SHOES", label: "Shoes" },
  { value: "TOYS_AND_GAMES", label: "Toys & Games" },
  { value: "WEDDINGS", label: "Weddings" },
]

const PRICE_RANGES = [
  { value: "0-25", label: "Under $25" },
  { value: "25-50", label: "$25 to $50" },
  { value: "50-100", label: "$50 to $100" },
  { value: "100-200", label: "$100 to $200" },
  { value: "200-", label: "$200 & Above" },
]

function ProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = searchParams.get("category")
  const priceRange = searchParams.get("price")
  const sortBy = searchParams.get("sort") || "newest"

  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [category, priceRange, sortBy])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.set("category", category)
      if (priceRange) params.set("priceRange", priceRange)
      params.set("sort", sortBy)

      const response = await fetch(`/api/products/filter?${params}`)
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/products?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push("/products")
  }

  const activeFiltersCount = [category, priceRange].filter(Boolean).length

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">All Products</h1>
          <p className="text-muted-foreground">Discover unique items from independent sellers</p>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          )}

          <div className="ml-auto">
            <select
              value={sortBy}
              onChange={(e) => updateFilter("sort", e.target.value)}
              className="px-4 py-2 rounded-full text-sm bg-secondary text-secondary-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 p-6 bg-card rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Filter */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Category</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => updateFilter("category", "")}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      !category
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    All Categories
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => updateFilter("category", cat.value)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        category === cat.value
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Price Range</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => updateFilter("price", "")}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      !priceRange
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    All Prices
                  </button>
                  {PRICE_RANGES.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => updateFilter("price", range.value)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        priceRange === range.value
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="bg-muted rounded-lg h-64 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-foreground">No products found</h3>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your filters to find what you're looking for.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/store/${product.storeSlug}/products/${product.slug}`}
                className="group"
              >
                <div className="aspect-square bg-muted relative overflow-hidden rounded-lg mb-2">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      No Image
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-sm text-card-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-1">{product.storeName}</p>
                <p className="text-sm font-semibold text-foreground">
                  ${product.price.toFixed(2)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="h-10 bg-muted rounded w-64 animate-pulse mb-2"></div>
            <div className="h-6 bg-muted rounded w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="bg-muted rounded-lg h-64 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
