"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import Link from "next/link"

interface EligibilityResponse {
  eligible: boolean
  reason?: string
  hasReview?: boolean
  reviewId?: string
  waitingForShipment?: boolean
  waitingPeriod?: boolean
  daysRemaining?: number
  expired?: boolean
  orderItem?: {
    id: string
    productId: string
    productName: string
    variantName: string | null
    imageUrl: string | null
  }
  product?: {
    id: string
    name: string
    slug: string
  }
  vendorStore?: {
    id: string
    name: string
    slug: string
  }
}

export default function WriteReviewPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const productId = params.productId as string
  const orderItemId = searchParams.get("orderItemId")
  const storeSlug = searchParams.get("storeSlug")

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [eligibility, setEligibility] = useState<EligibilityResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState("")
  const [review, setReview] = useState("")
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  const checkEligibility = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reviews/eligibility?orderItemId=${orderItemId}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.reason || "Unable to verify eligibility")
        setEligibility({ eligible: false, reason: data.reason })
        return
      }

      setEligibility(data)

      if (!data.eligible) {
        setError(data.reason)
      }
    } catch {
      setError("Failed to check review eligibility")
    } finally {
      setLoading(false)
    }
  }, [orderItemId])

  useEffect(() => {
    if (status === "unauthenticated") {
      const storeSlugParam = storeSlug ? `&storeSlug=${storeSlug}` : ''
      router.push(`/login?callbackUrl=/products/${productId}/review?orderItemId=${orderItemId}${storeSlugParam}`)
      return
    }

    if (status === "authenticated" && orderItemId) {
      checkEligibility()
    }
  }, [status, orderItemId, storeSlug, productId, router, checkEligibility])

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])

    if (photos.length + files.length > 3) {
      alert("Maximum 3 photos allowed")
      return
    }

    // Validate file types and sizes
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Please use JPG, PNG, or WebP.`)
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 5MB limit`)
        return
      }
    }

    // Add files and create preview URLs
    setPhotos([...photos, ...files])
    const newPreviewUrls = files.map(file => URL.createObjectURL(file))
    setPhotoPreviewUrls([...photoPreviewUrls, ...newPreviewUrls])
  }

  function removePhoto(index: number) {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(photoPreviewUrls[index])

    setPhotos(photos.filter((_, i) => i !== index))
    setPhotoPreviewUrls(photoPreviewUrls.filter((_, i) => i !== index))
  }

  async function uploadPhotos(): Promise<string[]> {
    if (photos.length === 0) {return []}

    setUploadingPhotos(true)
    try {
      const formData = new FormData()
      photos.forEach(photo => formData.append("photos", photo))

      const response = await fetch("/api/reviews/upload-photos", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload photos")
      }

      return data.urls
    } finally {
      setUploadingPhotos(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (rating === 0) {
      alert("Please select a star rating")
      return
    }

    if (review.length < 50) {
      alert("Review must be at least 50 characters")
      return
    }

    if (title && title.length < 10) {
      alert("Title must be at least 10 characters or leave it blank")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Upload photos first if any
      let photoUrls: string[] = []
      if (photos.length > 0) {
        photoUrls = await uploadPhotos()
      }

      const response = await fetch("/api/reviews/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderItemId,
          rating,
          title: title || undefined,
          review,
          photoUrls,
          customerName: session?.user?.name || "Anonymous",
          customerEmail: session?.user?.email || "",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review")
      }

      // Success! Redirect to product page
      alert("Thank you for your review!")
      router.push(`/store/${eligibility?.vendor_stores?.slug}/products/${eligibility?.product?.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review")
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!orderItemId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Request</h1>
          <p className="text-gray-600 mb-6">
            Order item not specified. Reviews must be submitted for purchased items.
          </p>
          <Link
            href="/account/orders"
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
          >
            View My Orders
          </Link>
        </div>
      </div>
    )
  }

  if (error || !eligibility?.eligible) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cannot Write Review</h1>
          <p className="text-gray-600 mb-6">{error || "You are not eligible to review this item"}</p>
          <Link
            href="/account/orders"
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/account/orders"
          className="inline-flex items-center text-sm text-blue-500 hover:text-blue-800 mb-6"
        >
          <svg
            className="h-4 w-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Orders
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Write a Review</h1>

          {/* Product Info */}
          <div className="flex items-center space-x-4 border-t pt-4">
            {eligibility.orderItem?.imageUrl ? (
              <img
                src={eligibility.orderItem.imageUrl}
                alt={eligibility.orderItem.productName}
                className="h-20 w-20 rounded-md object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-md bg-gray-200 flex items-center justify-center">
                <svg
                  className="h-10 w-10 text-gray-400"
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
            <div>
              <p className="font-medium text-gray-900">{eligibility.orderItem?.productName}</p>
              {eligibility.orderItem?.variantName && (
                <p className="text-sm text-gray-600">{eligibility.orderItem.variantName}</p>
              )}
              <p className="text-sm text-gray-500">
                Sold by{" "}
                <Link
                  href={`/store/${eligibility.vendor_stores?.slug}`}
                  className="text-blue-500 hover:text-blue-800"
                >
                  {eligibility.vendor_stores?.name}
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {/* Star Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none"
                >
                  <svg
                    className={`h-10 w-10 ${
                      star <= (hoverRating || rating)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-3 text-sm text-gray-600">
                  {rating} star{rating !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Review Title <span className="text-gray-500">(optional, min 10 chars)</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Sum up your experience in one line"
            />
            <p className="mt-1 text-sm text-gray-500">{title.length}/100 characters</p>
          </div>

          {/* Review Body */}
          <div className="mb-6">
            <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
              Your Review <span className="text-red-500">* (min 50 chars)</span>
            </label>
            <textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={6}
              maxLength={5000}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Share your thoughts about this product. What did you like or dislike? How would you use it? What should others know?"
            />
            <p className="mt-1 text-sm text-gray-500">
              {review.length}/5000 characters {review.length < 50 && `(${50 - review.length} more needed)`}
            </p>
          </div>

          {/* Photo Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos <span className="text-gray-500">(optional, max 3)</span>
            </label>

            {/* Photo Previews */}
            {photoPreviewUrls.length > 0 && (
              <div className="flex gap-3 mb-3">
                {photoPreviewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {photos.length < 3 && (
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <div className="text-center">
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    Click to upload photos
                  </p>
                  <p className="text-xs text-gray-500">
                    JPG, PNG, or WebP (max 5MB each)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingPhotos || rating === 0 || review.length < 50}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploadingPhotos ? "Uploading photos..." : submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
