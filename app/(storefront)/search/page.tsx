"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { logger } from "@/lib/logger"

type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  category: string | null
  image: string | null
  storeName: string
  storeSlug: string
  quantity: number
}

type Store = {
  id: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  productCount: number
}

type SearchResults = {
  products: Product[]
  stores: Store[]
  total: number
}

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const type = searchParams.get("type") || "all"
  const sortBy = searchParams.get("sortBy") || "relevance"

  const [results, setResults] = useState<SearchResults>({
    products: [],
    stores: [],
    total: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (query) {
      fetchResults()
    } else {
      setIsLoading(false)
    }
  }, [query, type, sortBy])

  const fetchResults = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        q: query,
        type,
        sortBy,
      })

      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()
      setResults(data)
    } catch (error) {
      logger.error("Search failed:", error)
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
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {query ? `Search results for "${query}"` : "Search"}
          </h1>
          {!isLoading && query && (
            <p className="text-muted-foreground">
              Found {results.total} result{results.total !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          {/* Type Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => updateFilter("type", "all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                type === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              All
            </button>
            <button
              onClick={() => updateFilter("type", "products")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                type === "products"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Products ({results.products.length})
            </button>
            <button
              onClick={() => updateFilter("type", "stores")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                type === "stores"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Stores ({results.stores.length})
            </button>
          </div>

          {/* Sort Filter - Only for products */}
          {(type === "all" || type === "products") && results.products.length > 0 && (
            <select
              value={sortBy}
              onChange={(e) => updateFilter("sortBy", e.target.value)}
              className="px-4 py-2 rounded-full text-sm font-medium bg-secondary text-secondary-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="relevance">Most Relevant</option>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-muted rounded-lg h-64 animate-pulse" />
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && query && results.total === 0 && (
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-foreground">No results found</h3>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </div>
        )}

        {/* Results */}
        {!isLoading && query && results.total > 0 && (
          <div className="space-y-12">
            {/* Stores */}
            {(type === "all" || type === "stores") && results.stores.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">Stores</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.stores.map((store) => (
                    <Link
                      key={store.id}
                      href={`/store/${store.slug}`}
                      className="bg-card rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-border hover:border-primary/30 group"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        {store.logoUrl ? (
                          <img
                            src={store.logoUrl}
                            alt={store.name}
                            className="w-16 h-16 rounded-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold group-hover:scale-110 transition-transform duration-300">
                            {store.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-semibold text-card-foreground">
                            {store.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {store.productCount} product{store.productCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      {store.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {store.description}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Products */}
            {(type === "all" || type === "products") && results.products.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">Products</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {results.products.map((product) => (
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
              </section>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !query && (
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-foreground">Start searching</h3>
            <p className="mt-2 text-muted-foreground">
              Use the search bar above to find products and stores.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-10 bg-muted rounded w-64 animate-pulse mb-2"></div>
            <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-muted rounded-lg h-64 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
