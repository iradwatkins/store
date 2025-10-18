import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

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
import { invalidateProductCache, invalidateVendorCache } from "@/lib/cache"

const createProductSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(20),
  category: z.enum([
    "ACCESSORIES",
    "ART_AND_COLLECTIBLES",
    "BAGS_AND_PURSES",
    "BATH_AND_BEAUTY",
    "BOOKS_MOVIES_AND_MUSIC",
    "CLOTHING",
    "CRAFT_SUPPLIES_AND_TOOLS",
    "ELECTRONICS_AND_ACCESSORIES",
    "HOME_AND_LIVING",
    "JEWELRY",
    "PAPER_AND_PARTY_SUPPLIES",
    "PET_SUPPLIES",
    "SHOES",
    "TOYS_AND_GAMES",
    "WEDDINGS",
  ]),
  subcategory: z.string().nullish(),
  price: z.string(),
  compareAtPrice: z.string().nullish(),
  sku: z.string().nullish(),
  trackInventory: z.string(),
  inventoryQuantity: z.string().nullish(),
  
  // OLD VARIANT SYSTEM (backward compatibility)
  variantType: z.enum(["NONE", "SIZE", "COLOR"]).optional(),
  variants: z.string().nullish(), // JSON string for old variants
  
  // NEW MULTI-VARIANT SYSTEM
  useMultiVariants: z.string().optional(), // "true" | "false"
  variantTypes: z.string().nullish(), // JSON string array: ["SIZE", "COLOR"]
  variantOptions: z.string().nullish(), // JSON string for variant options
  generateCombinations: z.string().optional(), // "true" | "false"
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's store
    const store = await prisma.vendorStore.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        Tenant: true,  // Include tenant to check quotas
      },
    })

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    // Check product quota (if store belongs to a tenant)
    if (store.Tenant) {
      const tenant = store.Tenant

      if (tenant.currentProducts >= tenant.maxProducts) {
        return NextResponse.json(
          {
            error: `Product limit reached (${tenant.maxProducts}). Please upgrade your plan to add more products.`,
            upgradeUrl: "/tenant-dashboard/billing",
            currentUsage: tenant.currentProducts,
            limit: tenant.maxProducts,
          },
          { status: 403 }
        )
      }
    }

    // Parse form data
    const formData = await request.formData()

    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      subcategory: formData.get("subcategory") as string | null,
      price: formData.get("price") as string,
      compareAtPrice: formData.get("compareAtPrice") as string | null,
      sku: formData.get("sku") as string | null,
      trackInventory: formData.get("trackInventory") as string,
      inventoryQuantity: formData.get("inventoryQuantity") as string | null,
      
      // OLD VARIANT SYSTEM
      variantType: formData.get("variantType") as string,
      variants: formData.get("variants") as string | null,
      
      // NEW MULTI-VARIANT SYSTEM
      useMultiVariants: formData.get("useMultiVariants") as string | null,
      variantTypes: formData.get("variantTypes") as string | null,
      variantOptions: formData.get("variantOptions") as string | null,
      generateCombinations: formData.get("generateCombinations") as string | null,
    }

    // Validate input
    const validatedData = createProductSchema.parse(data)

    // Generate slug from name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Check if slug exists for this store
    const existingProduct = await prisma.product.findFirst({
      where: {
        vendorStoreId: store.id,
        slug,
      },
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: "A product with this name already exists in your store" },
        { status: 400 }
      )
    }

    const price = parseFloat(validatedData.price)
    const compareAtPrice = validatedData.compareAtPrice
      ? parseFloat(validatedData.compareAtPrice)
      : null
    const trackInventory = validatedData.trackInventory === "true"
    
    // Determine variant system being used
    const useMultiVariants = validatedData.useMultiVariants === "true"
    const hasOldVariants = validatedData.variantType !== "NONE" && validatedData.variants
    const hasVariants = useMultiVariants || hasOldVariants
    
    // Parse multi-variant data if provided
    let variantTypes: string[] = []
    let variantOptions: any = null
    
    if (useMultiVariants) {
      variantTypes = validatedData.variantTypes ? JSON.parse(validatedData.variantTypes) : []
      variantOptions = validatedData.variantOptions ? JSON.parse(validatedData.variantOptions) : null
    }

    // Create product
    // Important: If product has variants, product-level inventory is ignored (set to 0)
    // Only variant-level inventory is used
    const product = await prisma.product.create({
      data: {
        vendorStoreId: store.id,
        name: validatedData.name,
        slug,
        description: validatedData.description,
        category: validatedData.category as any,
        subcategory: validatedData.subcategory || null,
        price: price,
        compareAtPrice,
        sku: validatedData.sku,
        trackInventory,
        // If product has variants, set quantity to 0 (variants track their own inventory)
        // Otherwise, use the provided inventory quantity
        quantity: hasVariants
          ? 0
          : (validatedData.inventoryQuantity ? parseInt(validatedData.inventoryQuantity) : 0),
        status: "DRAFT", // Start as draft
        
        // OLD VARIANT SYSTEM
        hasVariants,
        variantType: hasOldVariants ? validatedData.variantType as any : null,
        
        // NEW MULTI-VARIANT SYSTEM
        useMultiVariants,
        variantTypes,
      },
    })

    // Handle variants
    if (useMultiVariants && variantOptions && validatedData.generateCombinations === "true") {
      // NEW MULTI-VARIANT SYSTEM: Call the combinations API internally
      try {
        const combinationsResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/vendor/products/${product.id}/variants/combinations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('Cookie') || '',
          },
          body: JSON.stringify({
            variantTypes,
            options: variantOptions,
            generateCombinations: true,
            defaults: {
              quantity: 0,
              price: null,
            },
          }),
        })

        if (!combinationsResponse.ok) {
          throw new Error('Failed to create variant combinations')
        }
      } catch (error) {
        logger.error("Error creating variant combinations:", error)
        // Continue without variants rather than failing the entire product creation
      }
    } else if (hasOldVariants) {
      // OLD VARIANT SYSTEM: Create ProductVariant records
      const variants = JSON.parse(validatedData.variants!)

      for (const variant of variants) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: variant.name,
            value: variant.name, // Use the variant name as the value
            sku: variant.sku || null,
            price: variant.price ? parseFloat(variant.price) : null,
            quantity: variant.inventoryQuantity
              ? parseInt(variant.inventoryQuantity)
              : 0,
          },
        })
      }
    }

    // Handle image uploads
    const images = formData.getAll("images") as File[]

    // Check storage quota (if store belongs to a tenant)
    if (store.Tenant && images.length > 0) {
      const tenant = store.Tenant

      // Calculate total size of all images in GB
      const totalImageSize = images.reduce((sum, file) => sum + file.size, 0)
      const totalImageSizeGB = totalImageSize / (1024 * 1024 * 1024) // Convert to GB
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

    let totalUploadedSizeGB = 0 // Track actual uploaded size

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

      // Generate optimized image sizes (thumbnail, small, medium, large)
      const optimizedSizes = await generateImageSizes(buffer, productImageSizes, {
        quality: 85,
        format: 'webp', // Use WebP for better compression
      })

      // Upload all sizes to MinIO
      const imageUrls: { [key: string]: string } = {}
      for (const [sizeName, optimizedImage] of Object.entries(optimizedSizes)) {
        const ext = 'webp'
        const timestamp = Date.now()
        const path = `products/${store.id}/${product.id}/${timestamp}-${sizeName}.${ext}`

        const imageUrl = await storageHelpers.uploadFile(
          optimizedImage.buffer,
          path,
          'image/webp'
        )
        imageUrls[sizeName] = imageUrl
      }

      // Log compression stats (optional, for monitoring)
      const originalSize = buffer.length
      const optimizedSize = optimizedSizes.large.size
      const savings = calculateCompressionRatio(originalSize, optimizedSize)
      logger.info("Image optimized", { 
        fileName: file.name, 
        savedPercent: savings.savedPercent, 
        savedBytes: savings.savedBytes 
      })

      // Track total uploaded size (all variants combined)
      const allSizesTotal = Object.values(optimizedSizes).reduce((sum, img) => sum + img.size, 0)
      totalUploadedSizeGB += allSizesTotal / (1024 * 1024 * 1024) // Convert to GB

      // Create ProductImage record with separate size URLs
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: imageUrls.large, // Main/large image URL
          thumbnail: imageUrls.thumbnail, // Thumbnail size
          medium: imageUrls.medium, // Medium size
          large: imageUrls.large, // Large size
          altText: product.name,
          sortOrder: i,
        },
      })
    }

    // Increment storage usage for tenant (if applicable and images uploaded)
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

    // Increment product count for tenant (if applicable)
    if (store.tenantId) {
      await prisma.tenant.update({
        where: { id: store.tenantId },
        data: { currentProducts: { increment: 1 } },
      })
    }

    // Invalidate relevant caches
    await invalidateProductCache(product.id, store.id)
    await invalidateVendorCache(store.id)

    return NextResponse.json(
      {
        message: "Product created successfully",
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error("Product creation error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's store
    const store = await prisma.vendorStore.findFirst({
      where: {
        userId: session.user.id,
      },
    })

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const lowStock = searchParams.get("lowStock") === "true"

    // Build where clause
    const where: any = {
      vendorStoreId: store.id,
    }

    if (status) {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (lowStock) {
      where.quantity = {
        lte: 5,
        gte: 0,
      }
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: {
            orderBy: {
              sortOrder: "asc",
            },
            take: 1,
          },
          variants: true,
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error("Get products error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
