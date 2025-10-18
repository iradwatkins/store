"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface Review {
  id: string
  rating: number
  title?: string
  review: string
  customerName: string
  isVerifiedPurchase: boolean
  createdAt: string
  vendorResponse?: string
  vendorRespondedAt?: string
  status: string
  helpfulCount: number
  unhelpfulCount: number
  product: {
    id: string
    name: string
    slug: string
  }
}

export default function VendorReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [filter])

  async function fetchReviews() {
    try {
      setLoading(true)
      const url = `/api/dashboard/reviews?filter=${filter}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Failed to fetch reviews")
      }

      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  async function handleRespond(reviewId: string) {
    if (!responseText.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/reviews/review/${reviewId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: responseText }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit response")
      }

      await fetchReviews()
      setRespondingTo(null)
      setResponseText("")
      alert("Response posted successfully!")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to post response")
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  const stats = {
    total: reviews.length,
    needResponse: reviews.filter((r) => !r.vendorResponse).length,
    avgRating:
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : "0.0",
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
        <p className="text-gray-600 mt-2">Manage customer reviews for your products</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Reviews</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Need Response</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{stats.needResponse}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Average Rating</p>
          <p className="text-3xl font-bold text-yellow-500 mt-2">{stats.avgRating} ★</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border"
          }`}
        >
          All Reviews
        </button>
        <button
          onClick={() => setFilter("needResponse")}
          className={`px-4 py-2 rounded-lg ${
            filter === "needResponse"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border"
          }`}
        >
          Need Response
        </button>
        <button
          onClick={() => setFilter("responded")}
          className={`px-4 py-2 rounded-lg ${
            filter === "responded"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border"
          }`}
        >
          Responded
        </button>
        <button
          onClick={() => setFilter("flagged")}
          className={`px-4 py-2 rounded-lg ${
            filter === "flagged"
              ? "bg-red-600 text-white"
              : "bg-white text-gray-700 border"
          }`}
        >
          🚩 Flagged
        </button>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews</h3>
          <p className="mt-1 text-sm text-gray-500">
            Customer reviews will appear here once they start reviewing your products.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow p-6">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {renderStars(review.rating)}
                    {review.isVerifiedPurchase && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/store/${review.product.slug}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {review.product.name}
                  </Link>
                </div>
                <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
              </div>

              {/* Review Content */}
              <div className="mb-4">
                {review.title && (
                  <h3 className="font-semibold text-gray-900 mb-2">{review.title}</h3>
                )}
                <p className="text-gray-700">{review.review}</p>
                <p className="text-sm text-gray-500 mt-2">
                  by {review.customerName}
                </p>
              </div>

              {/* Helpfulness */}
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                <span>👍 {review.helpfulCount} found helpful</span>
                <span>👎 {review.unhelpfulCount}</span>
              </div>

              {/* Vendor Response */}
              {review.vendorResponse ? (
                <div className="bg-gray-50 border-l-4 border-blue-500 p-4 mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Your Response:</p>
                  <p className="text-gray-700">{review.vendorResponse}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Responded on {formatDate(review.vendorRespondedAt!)}
                  </p>
                </div>
              ) : respondingTo === review.id ? (
                <div className="mt-4">
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write your response..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleRespond(review.id)}
                      disabled={submitting || !responseText.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {submitting ? "Posting..." : "Post Response"}
                    </button>
                    <button
                      onClick={() => {
                        setRespondingTo(null)
                        setResponseText("")
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setRespondingTo(review.id)}
                  className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Respond to Review →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
