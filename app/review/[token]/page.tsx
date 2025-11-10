import { notFound } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/db"
import { decodeReviewToken } from "@/lib/review-token"
import ReviewForm from "./ReviewForm"

export default async function ReviewPage({
  params,
}: {
  params: { token: string }
}) {
  // Decode and validate token
  const { orderItemId, isValid, reason } = decodeReviewToken(params.token)

  if (!isValid || !orderItemId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Review Link
          </h1>
          <p className="text-gray-600 mb-6">
            {reason || "This review link is invalid or has expired."}
          </p>
          <Link
            href="/"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Fetch order item with product and order details
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      product: {
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
          vendor_stores: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
      storeOrder: {
        select: {
          customerEmail: true,
          customerName: true,
          shippedAt: true,
          paymentStatus: true,
          refundedAt: true,
        },
      },
      review: true, // Check if already reviewed
    },
  })

  if (!orderItem) {
    notFound()
  }

  // Check if already reviewed
  if (orderItem.review) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-green-500 text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Already Reviewed
          </h1>
          <p className="text-gray-600 mb-6">
            You&apos;ve already left a review for this product. Thank you for your
            feedback!
          </p>
          <Link
            href={`/store/${orderItem.product.vendor_stores.slug}/products/${orderItem.product.slug}`}
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            View Product
          </Link>
        </div>
      </div>
    )
  }

  // Check eligibility
  const order = orderItem.storeOrder
  if (!order.shippedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-yellow-500 text-5xl mb-4">📦</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Not Yet Shipped
          </h1>
          <p className="text-gray-600 mb-6">
            Please wait until your order has been shipped to leave a review.
          </p>
          <Link
            href="/"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Check if shipped at least 3 days ago
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  if (order.shippedAt > threeDaysAgo) {
    const daysRemaining = Math.ceil(
      (order.shippedAt.getTime() + 3 * 24 * 60 * 60 * 1000 - Date.now()) /
        (24 * 60 * 60 * 1000)
    )
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-blue-500 text-5xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Review Soon
          </h1>
          <p className="text-gray-600 mb-6">
            Please wait {daysRemaining} more day{daysRemaining > 1 ? "s" : ""}{" "}
            after shipment to leave a review.
          </p>
          <Link
            href="/"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Check if refunded
  if (order.refundedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-gray-500 text-5xl mb-4">↩️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Order Refunded
          </h1>
          <p className="text-gray-600 mb-6">
            You cannot review a refunded order.
          </p>
          <Link
            href="/"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const productImage =
    orderItem.product.product_images[0]?.url || orderItem.imageUrl || "/placeholder.png"

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            How was your purchase?
          </h1>
          <p className="text-gray-600">
            Share your experience with other shoppers
          </p>
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center gap-4">
            <img
              src={productImage}
              alt={orderItem.name}
              className="w-24 h-24 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {orderItem.name}
              </h2>
              {orderItem.variantName && (
                <p className="text-sm text-gray-600 mt-1">
                  {orderItem.variantName}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                from {orderItem.product.vendor_stores.name}
              </p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <ReviewForm
          orderItemId={orderItemId}
          customerName={order.customerName}
          customerEmail={order.customerEmail}
          productName={orderItem.name}
          productSlug={orderItem.product.slug}
          storeSlug={orderItem.product.vendor_stores.slug}
        />
      </div>
    </div>
  )
}
