import Link from "next/link"
import { Suspense } from "react"

function ThankYouContent({
  searchParams,
}: {
  searchParams: { product?: string }
}) {
  const productName = searchParams.product || "your purchase"

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Thank You for Your Review!
          </h1>
          <p className="text-xl text-gray-600">
            Your feedback helps the Chicago Steppin community
          </p>
        </div>

        {/* Confirmation Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="border-l-4 border-green-500 pl-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Review Submitted Successfully
            </h2>
            <p className="text-gray-600">
              Your review of <strong>{productName}</strong> has been published
              and is now visible to other shoppers.
            </p>
          </div>

          <div className="space-y-4 text-gray-700">
            <div className="flex items-start gap-3">
              <span className="text-green-500 text-xl">✓</span>
              <div>
                <p className="font-semibold">Your review is live</p>
                <p className="text-sm text-gray-600">
                  Other customers can now see your honest feedback
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-green-500 text-xl">✓</span>
              <div>
                <p className="font-semibold">Vendor notified</p>
                <p className="text-sm text-gray-600">
                  The shop owner has been informed of your review
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-green-500 text-xl">✓</span>
              <div>
                <p className="font-semibold">Supporting local vendors</p>
                <p className="text-sm text-gray-600">
                  Your feedback helps Chicago Steppers make informed decisions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md p-8 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-4">What's Next?</h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <span className="text-2xl">🛍️</span>
              <span>
                Browse more products from our Chicago Steppin vendors
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">⭐</span>
              <span>
                Your review may receive responses from the vendor
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">👍</span>
              <span>
                Other customers can mark your review as helpful
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Browse More Products
          </Link>
          <Link
            href="/account/orders"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-green-600 font-semibold rounded-lg border-2 border-green-600 hover:bg-green-50 transition-colors"
          >
            View My Orders
          </Link>
        </div>

        {/* Community Impact */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 text-sm mb-4">
            Thank you for being part of the SteppersLife community!
          </p>
          <div className="flex justify-center gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-green-600">⭐</p>
              <p className="text-xs text-gray-600 mt-1">Trusted Reviews</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">🤝</p>
              <p className="text-xs text-gray-600 mt-1">Support Local</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">💬</p>
              <p className="text-xs text-gray-600 mt-1">Build Community</p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Need to edit or remove your review?{" "}
            <Link
              href="/account/reviews"
              className="text-green-600 hover:underline"
            >
              Manage your reviews
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ReviewThankYouPage({
  searchParams,
}: {
  searchParams: { product?: string }
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      }
    >
      <ThankYouContent searchParams={searchParams} />
    </Suspense>
  )
}
