"use client"

import { useState, useCallback, DragEvent } from "react"

interface ImageUploadDropzoneProps {
  onImagesSelected: (files: File[]) => void
  maxImages?: number
  currentImageCount?: number
  accept?: string
}

export default function ImageUploadDropzone({
  onImagesSelected,
  maxImages = 5,
  currentImageCount = 0,
  accept = "image/*"
}: ImageUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))

    const remainingSlots = maxImages - currentImageCount
    const filesToUpload = imageFiles.slice(0, remainingSlots)

    if (filesToUpload.length > 0) {
      onImagesSelected(filesToUpload)
    }
  }, [maxImages, currentImageCount, onImagesSelected])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const remainingSlots = maxImages - currentImageCount
      const filesToUpload = files.slice(0, remainingSlots)

      if (filesToUpload.length > 0) {
        onImagesSelected(filesToUpload)
      }
    }
  }, [maxImages, currentImageCount, onImagesSelected])

  const remainingSlots = maxImages - currentImageCount
  const isMaxReached = remainingSlots <= 0

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.02]'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }
          ${isMaxReached ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          accept={accept}
          multiple
          onChange={handleFileInput}
          disabled={isMaxReached}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          id="image-upload-input"
        />

        <div className="space-y-4">
          {/* Upload Icon */}
          <div className="flex justify-center">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center transition-colors
              ${isDragging ? 'bg-blue-100' : 'bg-white'}
            `}>
              <svg
                className={`w-8 h-8 transition-colors ${isDragging ? 'text-blue-600' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
          </div>

          {/* Upload Text */}
          <div>
            <p className={`text-lg font-medium transition-colors ${isDragging ? 'text-blue-600' : 'text-gray-900'}`}>
              {isDragging ? 'Drop images here' : 'Drag & drop images here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse
            </p>
          </div>

          {/* Upload Info */}
          <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>PNG, JPG, WEBP</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Max {maxImages} images</span>
            </div>
          </div>

          {/* Remaining Slots */}
          {!isMaxReached && currentImageCount > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {remainingSlots} {remainingSlots === 1 ? 'slot' : 'slots'} remaining
            </div>
          )}

          {/* Max Reached */}
          {isMaxReached && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Maximum images reached
            </div>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="flex items-start gap-2 text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="font-medium text-blue-900">Pro tip:</p>
          <p className="text-blue-700 mt-0.5">
            The first image will be your product's primary image. You can reorder images after upload.
          </p>
        </div>
      </div>
    </div>
  )
}
