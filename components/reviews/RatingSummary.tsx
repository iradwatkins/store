"use client"

import StarRating from "./StarRating"

interface RatingSummaryProps {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

export default function RatingSummary({
  averageRating,
  totalReviews,
  ratingDistribution,
}: RatingSummaryProps) {
  // Calculate percentage for each rating
  const getPercentage = (count: number) => {
    if (totalReviews === 0) return 0
    return Math.round((count / totalReviews) * 100)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Overall Rating */}
      <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900">
            {averageRating.toFixed(1)}
          </div>
          <StarRating rating={averageRating} size="lg" className="mt-2" />
          <div className="text-sm text-gray-600 mt-2">
            {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingDistribution[stars as keyof typeof ratingDistribution]
            const percentage = getPercentage(count)

            return (
              <div key={stars} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-gray-700 font-medium">{stars}★</span>

                {/* Progress bar */}
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-12 text-right text-gray-600">
                  {percentage}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Call to Action */}
      <div className="pt-6">
        <p className="text-sm text-gray-600 mb-3">
          Share your experience with this product
        </p>
        <button
          className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          onClick={() => {
            // Scroll to reviews section
            document.getElementById("reviews-section")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }}
        >
          Read Reviews
        </button>
      </div>
    </div>
  )
}
