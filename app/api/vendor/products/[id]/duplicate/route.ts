import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { invalidateProductCache, invalidateVendorCache } from "@/lib/cache"
import { logger } from "@/lib/logger"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        Tenant: true, // Include tenant to check quotas
      },
    })

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    // Get the original product with all related data
    const originalProduct = await prisma.product.findFirst({
      where: {
        id: params.id,
        vendorStoreId: store.id,
      },
      include: {
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        variants: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    })

    if (!originalProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
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

    // Generate new name and slug
    const newName = `${originalProduct.name} (Copy)`
    const slug = newName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Ensure slug is unique
    let slugSuffix = 1
    let uniqueSlug = slug
    while (await prisma.product.findFirst({ where: { vendorStoreId: store.id, slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${slugSuffix}`
      slugSuffix++
    }

    // Create the duplicate product
    const duplicatedProduct = await prisma.product.create({
      data: {
        vendorStoreId: store.id,
        name: newName,
        slug: uniqueSlug,
        description: originalProduct.description,
        category: originalProduct.category,
        subcategory: originalProduct.subcategory,
        price: originalProduct.price,
        compareAtPrice: originalProduct.compareAtPrice,
        sku: originalProduct.sku ? `${originalProduct.sku}-copy` : null,
        trackInventory: originalProduct.trackInventory,
        quantity: originalProduct.quantity,
        status: "DRAFT", // Always create duplicates as draft
      },
    })

    // Duplicate variants
    if (originalProduct.variants.length > 0) {
      for (const variant of originalProduct.variants) {
        await prisma.productVariant.create({
          data: {
            productId: duplicatedProduct.id,
            name: variant.name,
            value: variant.value,
            sku: variant.sku ? `${variant.sku}-copy` : null,
            price: variant.price,
            quantity: variant.quantity,
            available: variant.available,
            sortOrder: variant.sortOrder,
          },
        })
      }
    }

    // Duplicate images
    if (originalProduct.images.length > 0) {
      for (const image of originalProduct.images) {
        await prisma.productImage.create({
          data: {
            productId: duplicatedProduct.id,
            url: image.url, // Keep same URLs since images are immutable
            thumbnail: image.thumbnail,
            medium: image.medium,
            large: image.large,
            altText: image.altText,
            sortOrder: image.sortOrder,
          },
        })
      }
    }

    // Increment product count for tenant (if applicable)
    if (store.tenantId) {
      await prisma.tenant.update({
        where: { id: store.tenantId },
        data: { currentProducts: { increment: 1 } },
      })
    }

    // Invalidate relevant caches
    await invalidateVendorCache(store.id)

    return NextResponse.json(
      {
        message: "Product duplicated successfully",
        product: {
          id: duplicatedProduct.id,
          name: duplicatedProduct.name,
          slug: duplicatedProduct.slug,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error("Product duplication error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
