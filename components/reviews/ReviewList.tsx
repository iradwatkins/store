"use client"

import { useState, useEffect } from "react"
import ReviewCard from "./ReviewCard"
import { useRouter, useSearchParams } from "next/navigation"
import { logger } from "@/lib/logger"

interface Review {
  id: string
  rating: number
  title?: string | null
  review: string
  photoUrls: string[]
  customerName: string
  isVerifiedPurchase: boolean
  createdAt: Date
  helpfulCount: number
  unhelpfulCount: number
  vendorResponse?: string | null
  vendorRespondedAt?: Date | null
}

interface ReviewListProps {
  productId: string
  storeName: string
  initialReviews: Review[]
  totalReviews: number
  currentPage: number
  pageSize: number
}

type SortOption = "recent" | "highest" | "lowest" | "helpful"

export default function ReviewList({
  productId,
  storeName,
  initialReviews,
  totalReviews,
  currentPage,
  pageSize,
}: ReviewListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [isLoading, setIsLoading] = useState(false)
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "recent"
  )
  const [page, setPage] = useState(currentPage)

  const totalPages = Math.ceil(totalReviews / pageSize)

  // Fetch reviews when sort or page changes
  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/reviews/${productId}?page=${page}&sort=${sort}&limit=${pageSize}`
        )
        const data = await response.json()
        setReviews(data.reviews)
      } catch (error) {
        logger.error("Failed to fetch reviews:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (page !== currentPage || sort !== (searchParams.get("sort") || "recent")) {
      fetchReviews()
    }
  }, [page, sort, productId, pageSize, currentPage, searchParams])

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort)
    setPage(1) // Reset to first page on sort change

    // Update URL
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", newSort)
    params.set("page", "1")
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)

    // Update URL
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", newPage.toString())
    router.push(`?${params.toString()}`, { scroll: false })

    // Scroll to reviews section
    document.getElementById("reviews-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  const handleVoteHelpful = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/review/${reviewId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "helpful" }),
      })

      const data = await response.json()

      if (response.ok) {
        // Update local state with both counts
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  helpfulCount: data.helpfulCount,
                  unhelpfulCount: data.unhelpfulCount
                }
              : r
          )
        )
      } else if (response.status === 409) {
        // Already voted - show message
        alert(data.error || "You have already voted on this review")
      }
    } catch (error) {
      logger.error("Failed to vote:", error)
    }
  }

  const handleVoteUnhelpful = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/review/${reviewId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "unhelpful" }),
      })

      const data = await response.json()

      if (response.ok) {
        // Update local state with both counts
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  helpfulCount: data.helpfulCount,
                  unhelpfulCount: data.unhelpfulCount
                }
              : r
          )
        )
      } else if (response.status === 409) {
        // Already voted - show message
        alert(data.error || "You have already voted on this review")
      }
    } catch (error) {
      logger.error("Failed to vote:", error)
    }
  }

  return (
    <div id="reviews-section" className="mt-12 border-t border-gray-200 pt-12">
      {/* Header with Sort Options */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Customer Reviews ({totalReviews})
        </h2>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-gray-600">
            Sort by:
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
        </div>
      ) : reviews.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {reviews.map((review) => (
            <div key={review.id} className="px-6">
              <ReviewCard
                review={review}
                storeName={storeName}
                onVoteHelpful={handleVoteHelpful}
                onVoteUnhelpful={handleVoteUnhelpful}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
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
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          <p className="mt-2 text-gray-600">No reviews yet</p>
          <p className="text-sm text-gray-500">Be the first to review this product!</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {/* Page Numbers */}
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                // Show first page, last page, current page, and pages around current
                return (
                  p === 1 ||
                  p === totalPages ||
                  (p >= page - 1 && p <= page + 1)
                )
              })
              .map((p, index, array) => {
                // Add ellipsis if there's a gap
                const showEllipsisBefore = index > 0 && p - array[index - 1] > 1

                return (
                  <div key={p} className="flex items-center gap-1">
                    {showEllipsisBefore && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(p)}
                      className={`px-4 py-2 border rounded-lg text-sm font-medium ${
                        p === page
                          ? "bg-green-600 text-white border-green-600"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  </div>
                )
              })}
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
