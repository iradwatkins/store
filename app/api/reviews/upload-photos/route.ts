import { NextRequest, NextResponse } from "next/server"
import { storageHelpers } from "@/lib/storage"
import { optimizeImage, validateImage } from "@/lib/image-optimizer"
import { randomBytes } from "crypto"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_PHOTOS = 3
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("photos") as File[]

    // Validate number of files
    if (files.length === 0) {
      return NextResponse.json(
        { error: "No photos provided" },
        { status: 400 }
      )
    }

    if (files.length > MAX_PHOTOS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PHOTOS} photos allowed` },
        { status: 400 }
      )
    }

    const uploadedUrls: string[] = []

    for (const file of files) {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Allowed: JPG, PNG, WebP` },
          { status: 400 }
        )
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File ${file.name} exceeds maximum size of 5MB`,
          },
          { status: 400 }
        )
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Validate image
      const validation = await validateImage(buffer)
      if (!validation.valid) {
        return NextResponse.json(
          {
            error: `Invalid image ${file.name}: ${validation.error}`,
          },
          { status: 400 }
        )
      }

      // Optimize image (compress to WebP, 80% quality)
      const optimized = await optimizeImage(buffer, {
        quality: 80,
        format: "webp",
      })

      // Generate unique filename
      const randomId = randomBytes(8).toString("hex")
      const timestamp = Date.now()
      const filename = `${timestamp}-${randomId}.webp`

      // Upload to MinIO under reviews/ path
      const path = `reviews/${filename}`
      const url = await storageHelpers.uploadFile(
        optimized.buffer,
        path,
        "image/webp"
      )

      uploadedUrls.push(url)
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      message: `Successfully uploaded ${uploadedUrls.length} photo(s)`,
    })
  } catch (error) {
    console.error("Photo upload error:", error)
    return NextResponse.json(
      {
        error: "Failed to upload photos",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
