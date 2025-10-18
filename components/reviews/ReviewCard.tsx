"use client"

import { useState } from "react"
import StarRating from "./StarRating"
import Image from "next/image"
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

interface ReviewCardProps {
  review: Review
  storeName: string
  onVoteHelpful?: (reviewId: string) => Promise<void>
  onVoteUnhelpful?: (reviewId: string) => Promise<void>
}

export default function ReviewCard({
  review,
  storeName,
  onVoteHelpful,
  onVoteUnhelpful,
}: ReviewCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showFullReview, setShowFullReview] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportDetails, setReportDetails] = useState("")
  const [reporting, setReporting] = useState(false)

  const reviewDate = new Date(review.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const isLongReview = review.review.length > 300

  const handleVote = async (type: "helpful" | "unhelpful") => {
    if (isVoting) return
    setIsVoting(true)

    try {
      if (type === "helpful" && onVoteHelpful) {
        await onVoteHelpful(review.id)
      } else if (type === "unhelpful" && onVoteUnhelpful) {
        await onVoteUnhelpful(review.id)
      }
    } catch (error) {
      logger.error("Vote failed:", error)
    } finally {
      setIsVoting(false)
    }
  }

  const handleReport = async () => {
    if (!reportReason) {
      alert("Please select a reason")
      return
    }

    setReporting(true)
    try {
      const response = await fetch(`/api/reviews/review/${review.id}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetails || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to report review")
      }

      alert("Review reported successfully. Thank you for helping us maintain quality.")
      setShowReportModal(false)
      setReportReason("")
      setReportDetails("")
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to report review")
    } finally {
      setReporting(false)
    }
  }

  return (
    <div className="border-b border-gray-200 py-6 last:border-b-0">
      {/* Review Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <StarRating rating={review.rating} size="md" />
            {review.title && (
              <h3 className="font-semibold text-gray-900">{review.title}</h3>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
            <span className="font-medium">{review.customerName}</span>
            {review.isVerifiedPurchase && (
              <>
                <span className="text-gray-400">•</span>
                <span className="flex items-center gap-1 text-green-600">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified Purchase
                </span>
              </>
            )}
            <span className="text-gray-400">•</span>
            <span>{reviewDate}</span>
          </div>
        </div>
      </div>

      {/* Review Text */}
      <div className="mt-4">
        <p className="text-gray-700 whitespace-pre-line">
          {isLongReview && !showFullReview
            ? `${review.review.substring(0, 300)}...`
            : review.review}
        </p>
        {isLongReview && (
          <button
            onClick={() => setShowFullReview(!showFullReview)}
            className="text-green-600 hover:text-green-700 text-sm font-medium mt-2"
          >
            {showFullReview ? "Show Less" : "Read More"}
          </button>
        )}
      </div>

      {/* Review Photos */}
      {review.photoUrls.length > 0 && (
        <div className="mt-4 flex gap-2">
          {review.photoUrls.map((url, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(url)}
              className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors cursor-pointer"
            >
              <Image
                src={url}
                alt={`Review photo ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Helpful Votes */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Was this review helpful?</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVote("helpful")}
              disabled={isVoting}
              className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg>
              <span>Yes ({review.helpfulCount})</span>
            </button>
            <button
              onClick={() => handleVote("unhelpful")}
              disabled={isVoting}
              className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg
                className="w-4 h-4 transform rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg>
              <span>No ({review.unhelpfulCount})</span>
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowReportModal(true)}
          className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
            />
          </svg>
          Report
        </button>
      </div>

      {/* Vendor Response */}
      {review.vendorResponse && (
        <div className="mt-4 ml-6 p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold text-gray-900">Response from {storeName}</span>
            {review.vendorRespondedAt && (
              <span className="text-sm text-gray-600">
                • {new Date(review.vendorRespondedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <p className="text-gray-700 whitespace-pre-line">{review.vendorResponse}</p>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Report Review</h3>
            <p className="text-sm text-gray-600 mb-4">
              Help us maintain quality by reporting inappropriate content
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Reason *</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select a reason</option>
                <option value="spam">Spam or fake review</option>
                <option value="offensive">Offensive language</option>
                <option value="off-topic">Off-topic content</option>
                <option value="personal-info">Contains personal information</option>
                <option value="external-links">Contains external links</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Additional Details (optional)
              </label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Provide more context..."
              />
              <p className="text-xs text-gray-500 mt-1">{reportDetails.length}/500</p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowReportModal(false)
                  setReportReason("")
                  setReportDetails("")
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={reporting || !reportReason}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
              >
                {reporting ? "Reporting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <Image
              src={selectedImage}
              alt="Review photo full size"
              width={800}
              height={600}
              className="max-w-full max-h-[90vh] rounded-lg object-contain"
              sizes="90vw"
            />
          </div>
        </div>
      )}
    </div>
  )
}
