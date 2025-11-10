import { notFound } from "next/navigation"
import Image from "next/image"
import prisma from "@/lib/db"
import StarRating from "@/components/reviews/StarRating"
import { auth } from "@/lib/auth"
import OwnerToolbar from "@/app/(storefront)/components/OwnerToolbar"
import CategoryFilter from "./CategoryFilter"

async function getStore(slug: string, isOwner: boolean = false) {
  const where: any = { slug }

  if (!isOwner) {
    where.isActive = true
  }

  const store = await prisma.vendor_stores.findUnique({
    where,
    include: {
      User: {
        select: {
          name: true,
          id: true,
        },
      },
      shop_ratings: true,
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

  const products = await prisma.products.findMany({
    where,
    include: {
      product_images: {
        orderBy: {
          sortOrder: "asc",
        },
        take: 1,
      },
      product_variants: true,
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
  const session = await auth()
  const resolvedParams = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined

  const storeForOwnerCheck = await prisma.vendor_stores.findUnique({
    where: { slug: resolvedParams.slug },
    select: { userId: true }
  })

  const isOwner = session?.user?.id === storeForOwnerCheck?.userId
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
    { value: "JEWELRY", label: "Jewelry" },
    { value: "PET_SUPPLIES", label: "Pet Supplies" },
    { value: "BOOKS_MOVIES_AND_MUSIC", label: "Books & Media" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Owner Toolbar */}
      {isOwner && <OwnerToolbar storeSlug={store.slug} />}

      {/* Hero Header with Store Info */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Store Logo */}
            {store.logo ? (
              <div className="relative w-32 h-32 flex-shrink-0 ring-4 ring-white/30 rounded-2xl overflow-hidden shadow-2xl bg-white">
                <Image
                  src={store.logo}
                  alt={store.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 flex-shrink-0 rounded-2xl bg-white/20 backdrop-blur-sm ring-4 ring-white/30 flex items-center justify-center shadow-2xl">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}

            {/* Store Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">{store.name}</h1>

              {store.tagline && (
                <p className="text-xl text-blue-100 mb-4">{store.tagline}</p>
              )}

              {store.description && (
                <p className="text-blue-50/90 mb-6 max-w-2xl">{store.description}</p>
              )}

              {/* Stats Bar */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                {/* Rating */}
                {store.shop_ratings && store.shop_ratings.averageRating ? (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                    <div className="flex items-center gap-1">
                      <StarRating rating={Number(store.shop_ratings.averageRating)} size="sm" />
                    </div>
                    <span className="font-semibold">{Number(store.shop_ratings.averageRating).toFixed(1)}</span>
                    <span className="text-white/70 text-sm">
                      ({store.shop_ratings.totalReviews} {store.shop_ratings.totalReviews === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                    <svg className="w-5 h-5 text-yellow-300 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                    <span className="font-semibold">New Store</span>
                  </div>
                )}

                {/* Products Count */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="font-semibold">{products.length}</span>
                  <span className="text-white/70 text-sm">{products.length === 1 ? 'Product' : 'Products'}</span>
                </div>

                {/* Vendor */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-white/90 text-sm">by {store.User.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave decoration at bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full text-white">
            <path d="M0 48L60 42.7C120 37 240 27 360 26.7C480 27 600 37 720 42.7C840 48 960 48 1080 42.7C1200 37 1320 27 1380 21.3L1440 16V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0V48Z" fill="currentColor"/>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Enhanced Filters */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <form method="GET" action={`/store/${store.slug}`} className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    name="search"
                    defaultValue={resolvedSearchParams?.search}
                    placeholder="Search products in this store..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {resolvedSearchParams?.category && (
                    <input type="hidden" name="category" value={resolvedSearchParams.category} />
                  )}
                </form>
              </div>

              {/* Category Filter */}
              <div className="md:w-64">
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
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Products Section */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {resolvedSearchParams?.search || resolvedSearchParams?.category
                  ? "No products found"
                  : "No Products Yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {resolvedSearchParams?.search || resolvedSearchParams?.category
                  ? "Try adjusting your filters to find what you're looking for"
                  : "This store hasn't listed any products yet. Check back soon!"}
              </p>
              {isOwner && !resolvedSearchParams?.search && !resolvedSearchParams?.category && (
                <a
                  href="/dashboard/products/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Your First Product
                </a>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Products Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {resolvedSearchParams?.category
                  ? `${categories.find(c => c.value === resolvedSearchParams.category)?.label || resolvedSearchParams.category} Products`
                  : "All Products"}
              </h2>
              <span className="text-sm text-gray-600">
                {products.length} {products.length === 1 ? "product" : "products"}
              </span>
            </div>

            {/* Enhanced Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <a
                  key={product.id}
                  href={`/store/${store.slug}/products/${product.slug}`}
                  className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-1 overflow-hidden relative"
                >
                  {/* Draft Badge */}
                  {isOwner && product.status === "DRAFT" && (
                    <div className="absolute top-3 right-3 z-20 px-3 py-1 bg-yellow-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full shadow-lg">
                      DRAFT
                    </div>
                  )}

                  {/* Product Image */}
                  <div className="aspect-square relative bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {product.product_images[0] ? (
                      <Image
                        src={product.product_images[0].medium || product.product_images[0].url}
                        alt={product.product_images[0].altText || product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
                        <svg className="h-16 w-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">No Image</span>
                      </div>
                    )}

                    {/* Category Badge */}
                    {product.category && (
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-medium rounded-full shadow">
                          {categories.find(c => c.value === product.category)?.label || product.category}
                        </span>
                      </div>
                    )}

                    {/* Quick View Hint */}
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
                        View
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          ${Number(product.price).toFixed(2)}
                        </p>
                        {product.compareAtPrice && (
                          <p className="text-sm text-gray-500 line-through">
                            ${Number(product.compareAtPrice).toFixed(2)}
                          </p>
                        )}
                      </div>
                      {product.product_variants.length > 0 && (
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {product.product_variants.length} {product.product_variants.length === 1 ? 'option' : 'options'}
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
