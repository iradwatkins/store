import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { storageHelpers } from "@/lib/storage"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = session.user.role === "ADMIN"

    // Get image and verify ownership
    const image = await prisma.productImage.findUnique({
      where: { id: params.imageId },
      include: {
        product: {
          include: {
            vendorStore: {
              include: {
                Tenant: true,
              },
            },
          },
        },
      },
    })

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    // Verify image belongs to this product
    if (image.productId !== params.id) {
      return NextResponse.json({ error: "Image does not belong to this product" }, { status: 400 })
    }

    const product = image.product
    const store = product.vendorStore

    // Check permission: admin can delete any image, vendor can only delete their own
    if (!isAdmin) {
      if (store.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    // Extract file paths from URLs to delete from MinIO
    const urlsToDelete = [image.url, image.thumbnail, image.medium, image.large].filter(Boolean)
    const pathsToDelete: string[] = []

    for (const url of urlsToDelete) {
      if (url) {
        // Extract the path after the bucket name
        // URL format: http://endpoint:port/bucket/path or https://cdn/bucket/path
        try {
          const urlObj = new URL(url)
          const pathname = urlObj.pathname
          const bucketName = process.env.MINIO_BUCKET || 'stepperslife-stores'

          // Remove leading slash and bucket name from path
          const pathAfterBucket = pathname.substring(pathname.indexOf(bucketName) + bucketName.length + 1)

          if (pathAfterBucket) {
            pathsToDelete.push(pathAfterBucket)
          }
        } catch (err) {
          console.error(`Failed to parse URL: ${url}`, err)
        }
      }
    }

    // Delete files from MinIO
    if (pathsToDelete.length > 0) {
      try {
        await storageHelpers.deleteFiles(pathsToDelete)
        console.log(`Deleted ${pathsToDelete.length} files from MinIO`)
      } catch (err) {
        console.error("Failed to delete files from MinIO:", err)
        // Continue even if MinIO deletion fails - we still want to remove the database record
      }
    }

    // Calculate approximate storage freed (estimate based on average image sizes)
    // This is a rough estimate since we don't store individual file sizes
    // Typical sizes: thumbnail ~20KB, medium ~100KB, large ~300KB = ~420KB per image set
    const estimatedSizeGB = (pathsToDelete.length * 0.105) / 1024 // ~105KB average per file in GB

    // Delete image record from database
    await prisma.productImage.delete({
      where: { id: params.imageId },
    })

    // Decrement storage usage for tenant (if applicable)
    if (store.tenantId && estimatedSizeGB > 0) {
      await prisma.tenant.update({
        where: { id: store.tenantId },
        data: {
          currentStorageGB: {
            decrement: estimatedSizeGB,
          },
        },
      })
    }

    console.log(`${isAdmin ? 'Admin' : 'Vendor'} deleted image from product: ${product.name}`)

    return NextResponse.json({
      message: "Image deleted successfully",
    })
  } catch (error) {
    console.error("Image deletion error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
