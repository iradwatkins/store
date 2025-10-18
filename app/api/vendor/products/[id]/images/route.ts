import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { storageHelpers } from "@/lib/storage"
import { logger } from "@/lib/logger"
import {
  validateImage,
  generateImageSizes,
  productImageSizes,
  calculateCompressionRatio
} from "@/lib/image-optimizer"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = session.user.role === "ADMIN"

    // Get product and verify ownership
    let product
    let store

    if (isAdmin) {
      // Admin can upload images to any product
      product = await prisma.product.findUnique({
        where: { id: params.id },
        include: {
          vendorStore: {
            include: {
              Tenant: true,
            },
          },
          images: true,
        },
      })

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }

      store = product.vendorStore
    } else {
      // Vendor can only upload images to their own products
      store = await prisma.vendorStore.findFirst({
        where: {
          userId: session.user.id,
        },
        include: {
          Tenant: true,
        },
      })

      if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 })
      }

      product = await prisma.product.findFirst({
        where: {
          id: params.id,
          vendorStoreId: store.id,
        },
        include: {
          images: true,
        },
      })

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }
    }

    // Parse form data
    const formData = await request.formData()
    const images = formData.getAll("images") as File[]

    if (images.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      )
    }

    // Check storage quota (if store belongs to a tenant)
    if (store.Tenant && images.length > 0) {
      const tenant = store.Tenant

      // Calculate total size of all images in GB
      const totalImageSize = images.reduce((sum, file) => sum + file.size, 0)
      const totalImageSizeGB = totalImageSize / (1024 * 1024 * 1024)
      const newStorageTotal = Number(tenant.currentStorageGB) + totalImageSizeGB

      if (newStorageTotal > Number(tenant.maxStorageGB)) {
        return NextResponse.json(
          {
            error: `Storage limit exceeded. You're using ${tenant.currentStorageGB}GB of ${tenant.maxStorageGB}GB. These images would add ${totalImageSizeGB.toFixed(2)}GB.`,
            upgradeUrl: "/tenant-dashboard/billing",
            currentUsage: Number(tenant.currentStorageGB),
            limit: Number(tenant.maxStorageGB),
            additionalNeeded: totalImageSizeGB,
          },
          { status: 403 }
        )
      }
    }

    let totalUploadedSizeGB = 0

    // Get current max sortOrder for this product
    const maxSortOrder = product.images.length > 0
      ? Math.max(...product.images.map((img: any) => img.sortOrder))
      : -1

    const uploadedImages = []

    for (let i = 0; i < images.length; i++) {
      const file = images[i]
      const buffer = Buffer.from(await file.arrayBuffer())

      // Validate image
      const validation = await validateImage(buffer)
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Image validation failed: ${validation.error}` },
          { status: 400 }
        )
      }

      // Generate optimized image sizes
      const optimizedSizes = await generateImageSizes(buffer, productImageSizes, {
        quality: 85,
        format: 'webp',
      })

      // Upload all sizes to MinIO
      const imageUrls: { [key: string]: string } = {}
      for (const [sizeName, optimizedImage] of Object.entries(optimizedSizes)) {
        const ext = 'webp'
        const timestamp = Date.now()
        const path = `products/${store.id}/${product.id}/${timestamp}-${i}-${sizeName}.${ext}`

        const imageUrl = await storageHelpers.uploadFile(
          optimizedImage.buffer,
          path,
          'image/webp'
        )
        imageUrls[sizeName] = imageUrl
      }

      // Log compression stats
      const originalSize = buffer.length
      const optimizedSize = optimizedSizes.large.size
      const savings = calculateCompressionRatio(originalSize, optimizedSize)
      logger.info(
        `Image optimized: ${file.name} | Saved ${savings.savedPercent}% (${savings.savedBytes} bytes)`
      )

      // Track total uploaded size
      const allSizesTotal = Object.values(optimizedSizes).reduce((sum, img) => sum + img.size, 0)
      totalUploadedSizeGB += allSizesTotal / (1024 * 1024 * 1024)

      // Create ProductImage record
      const productImage = await prisma.productImage.create({
        data: {
          productId: product.id,
          url: imageUrls.large,
          thumbnail: imageUrls.thumbnail,
          medium: imageUrls.medium,
          large: imageUrls.large,
          altText: product.name,
          sortOrder: maxSortOrder + i + 1,
        },
      })

      uploadedImages.push(productImage)
    }

    // Increment storage usage for tenant (if applicable)
    if (store.tenantId && totalUploadedSizeGB > 0) {
      await prisma.tenant.update({
        where: { id: store.tenantId },
        data: {
          currentStorageGB: {
            increment: totalUploadedSizeGB,
          },
        },
      })
    }

    logger.info(`${isAdmin ? 'Admin' : 'Vendor'} uploaded ${uploadedImages.length} images to product: ${product.name}`)

    return NextResponse.json(
      {
        message: `${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''} uploaded successfully`,
        images: uploadedImages,
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error("Image upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
