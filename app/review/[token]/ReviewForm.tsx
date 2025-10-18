"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface ReviewFormProps {
  orderItemId: string
  customerName: string
  customerEmail: string
  productName: string
  productSlug: string
  storeSlug: string
}

export default function ReviewForm({
  orderItemId,
  customerName,
  customerEmail,
  productName,
  productSlug,
  storeSlug,
}: ReviewFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState("")
  const [review, setReview] = useState("")
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Limit to 3 photos
    if (photos.length + files.length > 3) {
      setError("You can upload a maximum of 3 photos")
      return
    }

    // Check file sizes (max 5MB each)
    const oversized = files.find((file) => file.size > 5 * 1024 * 1024)
    if (oversized) {
      setError("Each photo must be less than 5MB")
      return
    }

    // Add files
    setPhotos([...photos, ...files])

    // Create previews
    const newPreviews = files.map((file) => URL.createObjectURL(file))
    setPhotoPreviews([...photoPreviews, ...newPreviews])
  }

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
    URL.revokeObjectURL(photoPreviews[index])
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (rating === 0) {
      setError("Please select a rating")
      return
    }

    if (review.trim().length < 10) {
      setError("Review must be at least 10 characters")
      return
    }

    if (review.trim().length > 1000) {
      setError("Review must be less than 1000 characters")
      return
    }

    setIsSubmitting(true)

    try {
      // Upload photos to MinIO first
      const photoUrls: string[] = []

      if (photos.length > 0) {
        const formData = new FormData()
        photos.forEach((photo) => formData.append("photos", photo))

        const uploadRes = await fetch("/api/reviews/upload-photos", {
          method: "POST",
          body: formData,
        })

        if (!uploadRes.ok) {
          const uploadError = await uploadRes.json()
          setError(uploadError.error || "Failed to upload photos")
          setIsSubmitting(false)
          return
        }

        const uploadData = await uploadRes.json()
        photoUrls.push(...uploadData.urls)
      }

      // Submit review
      const res = await fetch("/api/reviews/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderItemId,
          rating,
          title: title.trim() || undefined,
          review: review.trim(),
          photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
          customerName,
          customerEmail,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to submit review")
        setIsSubmitting(false)
        return
      }

      // Redirect to thank you page
      router.push(`/review/thank-you?product=${productName}`)
    } catch (err) {
      console.error("Error submitting review:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-8">
      {/* Rating */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-4xl transition-transform hover:scale-110"
            >
              {star <= (hoverRating || rating) ? "⭐" : "☆"}
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            {rating === 5 && "Excellent!"}
            {rating === 4 && "Good"}
            {rating === 3 && "Average"}
            {rating === 2 && "Below Average"}
            {rating === 1 && "Poor"}
          </p>
        )}
      </div>

      {/* Title (optional) */}
      <div className="mb-6">
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Review Title (optional)
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="Sum up your experience"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
      </div>

      {/* Review Text */}
      <div className="mb-6">
        <label
          htmlFor="review"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Your Review <span className="text-red-500">*</span>
        </label>
        <textarea
          id="review"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={6}
          minLength={10}
          maxLength={1000}
          placeholder="Share details of your experience with this product"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          {review.length}/1000 (minimum 10 characters)
        </p>
      </div>

      {/* Photos (optional) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Photos (optional)
        </label>
        <p className="text-sm text-gray-600 mb-3">
          Help shoppers see how the product looks. You can upload up to 3
          photos.
        </p>

        {/* Photo Previews */}
        {photoPreviews.length > 0 && (
          <div className="flex gap-4 mb-4">
            {photoPreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {photos.length < 3 && (
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <span>📷</span>
            <span>Upload Photos</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
        )}
        <p className="text-xs text-gray-500 mt-2">
          JPG, PNG, or WebP. Max 5MB per photo.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || rating === 0 || review.trim().length < 10}
        className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </button>

      {/* Privacy Note */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        By submitting this review, you confirm that it reflects your own honest
        experience with the product.
      </p>
    </form>
  )
}
