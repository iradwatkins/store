import { notFound } from "next/navigation"
import prisma from "@/lib/db"
import AddToCartButton from "./AddToCartButton"
import { getOrSetCache, cacheKeys, cacheTTL } from "@/lib/cache"
import StarRating from "@/components/reviews/StarRating"
import RatingSummary from "@/components/reviews/RatingSummary"
import ReviewList from "@/components/reviews/ReviewList"
import { auth } from "@/lib/auth"
import OwnerToolbar from "@/app/(storefront)/components/OwnerToolbar"

async function getProduct(storeSlug: string, productSlug: string, isOwner: boolean = false) {
  // Skip cache if owner is viewing (to see draft products)
  if (isOwner) {
    // Owners can view their store even if not active (e.g., during setup)
    const store = await prisma.vendorStore.findUnique({
      where: {
        slug: storeSlug,
      },
      include: {
        User: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    })

    if (!store) return null

    const product = await prisma.product.findFirst({
      where: {
        slug: productSlug,
        vendorStoreId: store.id,
        // Owners can see all product statuses
      },
      include: {
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        variants: {
          orderBy: {
            name: "asc",
          },
        },
        vendorStore: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            User: {
              select: {
                name: true,
                id: true,
              },
            },
          },
        },
      },
    })

    return product
  }

  // Regular users see cached ACTIVE products only
  return getOrSetCache(
    cacheKeys.product(`${storeSlug}:${productSlug}`),
    async () => {
      const store = await prisma.vendorStore.findUnique({
        where: {
          slug: storeSlug,
          isActive: true,
        },
      })

      if (!store) return null

      const product = await prisma.product.findFirst({
        where: {
          slug: productSlug,
          vendorStoreId: store.id,
          status: "ACTIVE",
        },
        include: {
          images: {
            orderBy: {
              sortOrder: "asc",
            },
          },
          variants: {
            orderBy: {
              name: "asc",
            },
          },
          vendorStore: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              User: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      })

      return product
    },
    { ttl: cacheTTL.medium, tags: ['products'] }
  )
}

async function getRelatedProducts(storeId: string, productId: string, category: string) {
  const products = await prisma.product.findMany({
    where: {
      vendorStoreId: storeId,
      status: "ACTIVE",
      category: category as any,
      id: {
        not: productId,
      },
    },
    include: {
      images: {
        orderBy: {
          sortOrder: "asc",
        },
        take: 1,
      },
    },
    take: 4,
    orderBy: {
      createdAt: "desc",
    },
  })

  return products
}

async function getReviewsData(productId: string, page: number = 1) {
  const limit = 10
  const skip = (page - 1) * limit

  const [reviews, totalCount, ratingDistribution] = await Promise.all([
    prisma.productReview.findMany({
      where: {
        productId,
        status: "PUBLISHED",
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        rating: true,
        title: true,
        review: true,
        photoUrls: true,
        customerName: true,
        isVerifiedPurchase: true,
        vendorResponse: true,
        vendorRespondedAt: true,
        helpfulCount: true,
        unhelpfulCount: true,
        createdAt: true,
      },
    }),
    prisma.productReview.count({
      where: {
        productId,
        status: "PUBLISHED",
      },
    }),
    prisma.productReview.groupBy({
      by: ["rating"],
      where: {
        productId,
        status: "PUBLISHED",
      },
      _count: {
        rating: true,
      },
    }),
  ])

  const distribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  }

  ratingDistribution.forEach((item) => {
    distribution[item.rating as keyof typeof distribution] = item._count.rating
  })

  return {
    reviews,
    totalCount,
    distribution,
  }
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string; productSlug: string }
  searchParams: { page?: string; sort?: string }
}) {
  // Check if current user is the store owner
  const session = await auth()
  let isOwner = false

  if (session?.user?.id) {
    const store = await prisma.vendorStore.findUnique({
      where: { slug: params.slug },
      select: { userId: true },
    })
    isOwner = session.user.id === store?.userId
  }

  const product = await getProduct(params.slug, params.productSlug, isOwner)

  if (!product) {
    notFound()
  }

  const currentPage = parseInt(searchParams.page || "1")

  const [relatedProducts, reviewsData] = await Promise.all([
    getRelatedProducts(product.vendorStoreId, product.id, product.category),
    getReviewsData(product.id, currentPage),
  ])

  const hasVariants = product.variants.length > 0

  return (
    <div className="min-h-screen bg-white">
      {/* Owner Toolbar */}
      {isOwner && <OwnerToolbar productId={product.id} storeSlug={params.slug} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-8 text-sm">
          <a href="/" className="text-gray-500 hover:text-gray-700">
            Home
          </a>
          <span className="mx-2 text-gray-400">/</span>
          <a
            href={`/store/${params.slug}`}
            className="text-gray-500 hover:text-gray-700"
          >
            {product.vendorStore.name}
          </a>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            {product.images.length > 0 ? (
              <>
                <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={product.images[0].url}
                    alt={product.images[0].altText || product.name}
                    className="w-full h-96 object-cover object-center"
                  />
                </div>
                {product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-4">
                    {product.images.slice(1).map((image) => (
                      <div
                        key={image.id}
                        className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-75"
                      >
                        <img
                          src={image.url}
                          alt={image.altText || product.name}
                          className="w-full h-24 object-cover object-center"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg
                  className="h-24 w-24 text-gray-300"
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

          {/* Product Info */}
          <div className="mt-10 lg:mt-0">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              {isOwner && product.status === "DRAFT" && (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded-full">
                  DRAFT
                </span>
              )}
            </div>

            {/* Rating Display */}
            {product.averageRating && product.reviewCount > 0 && (
              <div className="mt-3 flex items-center gap-3">
                <StarRating
                  rating={Number(product.averageRating)}
                  size="md"
                  showNumber
                />
                <a
                  href="#reviews-section"
                  className="text-sm text-gray-600 hover:text-green-600 transition-colors"
                >
                  ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})
                </a>
              </div>
            )}

            {/* Price */}
            <div className="mt-3">
              <div className="flex items-center space-x-3">
                <p className="text-3xl font-semibold text-gray-900">
                  ${Number(product.price).toFixed(2)}
                </p>
                {product.compareAtPrice && (
                  <p className="text-xl text-gray-500 line-through">
                    ${Number(product.compareAtPrice).toFixed(2)}
                  </p>
                )}
              </div>
              {product.compareAtPrice && (
                <p className="mt-1 text-sm text-green-600">
                  Save $
                  {(Number(product.compareAtPrice) - Number(product.price)).toFixed(2)} (
                  {Math.round(
                    ((Number(product.compareAtPrice) - Number(product.price)) /
                      Number(product.compareAtPrice)) *
                      100
                  )}
                  % off)
                </p>
              )}
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <div className="text-base text-gray-700 whitespace-pre-line">
                {product.description}
              </div>
            </div>

            {/* Add to Cart */}
            <div className="mt-8">
              <AddToCartButton
                product={{
                  id: product.id,
                  name: product.name,
                  price: Number(product.price),
                  slug: product.slug,
                  image: product.images[0]?.url,
                  trackInventory: product.trackInventory,
                  inventoryQuantity: product.quantity,
                }}
                variants={product.variants.map((v) => ({
                  id: v.id,
                  type: v.type,
                  name: v.name,
                  price: v.price ? Number(v.price) : null,
                  inventoryQuantity: v.quantity,
                }))}
                storeSlug={params.slug}
              />
            </div>

            {/* Product Details */}
            <div className="mt-10 border-t border-gray-200 pt-10">
              <h3 className="text-sm font-medium text-gray-900">Product Details</h3>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Category:</span> {product.category}
                </p>
                {product.sku && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">SKU:</span> {product.sku}
                  </p>
                )}
                {product.trackInventory && product.quantity !== null && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Availability:</span>{" "}
                    {product.quantity > 0
                      ? `${product.quantity} in stock`
                      : "Out of stock"}
                  </p>
                )}
              </div>
            </div>

            {/* Store Info */}
            <div className="mt-10 border-t border-gray-200 pt-10">
              <h3 className="text-sm font-medium text-gray-900">Sold By</h3>
              <div className="mt-4">
                <a
                  href={`/store/${params.slug}`}
                  className="text-blue-500 hover:text-blue-400 font-medium"
                >
                  {product.vendorStore.name}
                </a>
                <p className="text-sm text-gray-500 mt-1">
                  by {product.vendorStore.User.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Summary & Reviews */}
        <div className="mt-16 border-t border-gray-200 pt-16">
          <div className="lg:grid lg:grid-cols-3 lg:gap-x-12">
            {/* Rating Summary Sidebar */}
            <div className="lg:col-span-1">
              {product.averageRating && product.reviewCount > 0 ? (
                <RatingSummary
                  averageRating={Number(product.averageRating)}
                  totalReviews={product.reviewCount}
                  ratingDistribution={reviewsData.distribution}
                />
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-gray-600 mb-4">No reviews yet</p>
                  <p className="text-sm text-gray-500">
                    Be the first to review this product!
                  </p>
                </div>
              )}
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-2 mt-12 lg:mt-0">
              <ReviewList
                productId={product.id}
                storeName={product.vendorStore.name}
                initialReviews={reviewsData.reviews}
                totalReviews={reviewsData.totalCount}
                currentPage={currentPage}
                pageSize={10}
              />
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 border-t border-gray-200 pt-16">
            <h2 className="text-2xl font-bold text-gray-900">You May Also Like</h2>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <a
                  key={relatedProduct.id}
                  href={`/store/${params.slug}/products/${relatedProduct.slug}`}
                  className="group bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200">
                    {relatedProduct.images[0] ? (
                      <img
                        src={relatedProduct.images[0].url}
                        alt={relatedProduct.images[0].altText || relatedProduct.name}
                        className="h-48 w-full object-cover object-center group-hover:opacity-75"
                      />
                    ) : (
                      <div className="h-48 w-full flex items-center justify-center bg-gray-100">
                        <svg
                          className="h-12 w-12 text-gray-300"
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
                      {relatedProduct.name}
                    </h3>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      ${Number(relatedProduct.price).toFixed(2)}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
