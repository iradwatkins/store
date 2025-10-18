import { notFound } from "next/navigation"
import Image from "next/image"
import prisma from "@/lib/db"
import { storageHelpers } from "@/lib/storage"
import CategoryFilter from "./CategoryFilter"
import StarRating from "@/components/reviews/StarRating"
import { auth } from "@/lib/auth"
import OwnerToolbar from "@/app/(storefront)/components/OwnerToolbar"
// import { getOrSetCache, cacheKeys, cacheTTL } from "@/lib/cache"

async function getStore(slug: string, isOwner: boolean = false) {
  const where: any = { slug }

  // Non-owners can only see active stores
  if (!isOwner) {
    where.isActive = true
  }

  const store = await prisma.vendorStore.findUnique({
    where,
    include: {
      User: {
        select: {
          name: true,
          id: true,
        },
      },
      ShopRating: true,
    },
  })

  return store
}

async function getProducts(
  storeId: string,
  isOwner: boolean,
  category?: string,
  search?: string
) {
  const where: any = {
    vendorStoreId: storeId,
  }

  // Show DRAFT products to store owners, only ACTIVE products to everyone else
  if (!isOwner) {
    where.status = "ACTIVE"
  }

  if (category) {
    where.category = category
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ]
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      images: {
        orderBy: {
          sortOrder: "asc",
        },
        take: 1,
      },
      variants: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return products
}

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ category?: string; search?: string }>
}) {
  // Check authentication first
  const session = await auth()

  // Await params and searchParams since they're now async in Next.js 15
  const resolvedParams = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined

  // Try to get store first without isOwner check to determine ownership
  const storeForOwnerCheck = await prisma.vendorStore.findUnique({
    where: { slug: resolvedParams.slug },
    select: { userId: true }
  })

  const isOwner = session?.user?.id === storeForOwnerCheck?.userId

  // Now get the full store data with owner privileges if applicable
  const store = await getStore(resolvedParams.slug, isOwner)

  if (!store) {
    notFound()
  }

  const products = await getProducts(
    store.id,
    isOwner,
    resolvedSearchParams?.category,
    resolvedSearchParams?.search
  )

  const categories = [
    { value: "CLOTHING", label: "Clothing" },
    { value: "SHOES", label: "Shoes" },
    { value: "ACCESSORIES", label: "Accessories" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Owner Toolbar */}
      {isOwner && <OwnerToolbar storeSlug={store.slug} />}

      {/* Store Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
              {store.tagline && (
                <p className="mt-1 text-lg text-gray-600">{store.tagline}</p>
              )}

              {/* Shop Rating */}
              {store.ShopRating && store.ShopRating.averageRating && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <StarRating rating={Number(store.ShopRating.averageRating)} size="md" />
                    <span className="text-lg font-semibold text-gray-900">
                      {Number(store.ShopRating.averageRating).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    ({store.ShopRating.totalReviews} {store.ShopRating.totalReviews === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}

              {store.description && (
                <p className="mt-2 text-sm text-gray-500 max-w-2xl">
                  {store.description}
                </p>
              )}
            </div>
            <div className="text-sm text-gray-500">
              by {store.User.name}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <form method="GET" action={`/store/${store.slug}`}>
              <input
                type="text"
                name="search"
                defaultValue={resolvedSearchParams?.search}
                placeholder="Search products..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {resolvedSearchParams?.category && (
                <input type="hidden" name="category" value={resolvedSearchParams.category} />
              )}
            </form>
          </div>

          {/* Category Filter */}
          <div className="sm:w-48">
            <CategoryFilter
              storeSlug={store.slug}
              categories={categories}
              currentCategory={resolvedSearchParams?.category}
              currentSearch={resolvedSearchParams?.search}
            />
          </div>

          {/* Clear Filters */}
          {(resolvedSearchParams?.category || resolvedSearchParams?.search) && (
            <a
              href={`/store/${store.slug}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear Filters
            </a>
          )}
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {resolvedSearchParams?.search || resolvedSearchParams?.category
                ? "Try adjusting your filters"
                : "This store hasn't added any products yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <a
                key={product.id}
                href={`/store/${store.slug}/products/${product.slug}`}
                className="group bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 relative"
              >
                {/* Draft badge for owner preview */}
                {isOwner && product.status === "DRAFT" && (
                  <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                    DRAFT
                  </div>
                )}
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200 relative">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0].medium || product.images[0].url}
                      alt={product.images[0].altText || product.name}
                      fill
                      className="object-cover object-center group-hover:opacity-75"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="h-64 w-full flex items-center justify-center bg-gray-100">
                      <svg
                        className="h-16 w-16 text-gray-300"
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
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        ${Number(product.price).toFixed(2)}
                      </p>
                      {product.compareAtPrice && (
                        <p className="text-sm text-gray-500 line-through">
                          ${Number(product.compareAtPrice).toFixed(2)}
                        </p>
                      )}
                    </div>
                    {product.variants.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {product.variants.length} options
                      </p>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
