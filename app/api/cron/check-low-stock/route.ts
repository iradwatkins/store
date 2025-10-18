import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { sendLowStockAlert } from "@/lib/email"
import { logger } from "@/lib/logger"

/**
 * Cron job to check for low stock items and send alerts to vendors
 * Runs daily to check inventory levels
 *
 * Set up in your cron service (e.g., Vercel Cron, GitHub Actions, or cron-job.org):
 * Schedule: "0 9 * * *" (9 AM UTC daily)
 * URL: POST /api/cron/check-low-stock
 * Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      logger.error("CRON_SECRET not configured")
      return NextResponse.json(
        { error: "Cron job not configured" },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    logger.info("Starting low stock check...")

    // Find all products with low stock (where inventory is tracked)
    const lowStockProducts = await prisma.product.findMany({
      where: {
        trackInventory: true,
        status: "ACTIVE", // Only check active products
        OR: [
          // Products without variants where quantity <= threshold
          {
            hasVariants: false,
            quantity: {
              lte: prisma.raw("low_stock_threshold"), // Compare with threshold
            },
          },
          // Products with variants (we'll check variants separately)
          {
            hasVariants: true,
          },
        ],
      },
      include: {
        vendorStore: {
          include: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: {
            url: true,
            medium: true,
          },
        },
        variants: {
          where: {
            available: true,
          },
          select: {
            id: true,
            name: true,
            value: true,
            quantity: true,
          },
        },
      },
    })

    logger.info(`Found ${lowStockProducts.length} products to check`)

    // Group products by vendor store
    const vendorLowStockMap = new Map<string, any[]>()

    for (const product of lowStockProducts) {
      let isLowStock = false
      const productData: any = {
        id: product.id,
        name: product.name,
        sku: product.sku || undefined,
        currentStock: product.quantity,
        lowStockThreshold: product.lowStockThreshold,
        imageUrl:
          product.images[0]?.medium || product.images[0]?.url || undefined,
        hasVariants: product.hasVariants,
      }

      if (product.hasVariants && product.variants.length > 0) {
        // Check variants for low stock
        const lowStockVariants = product.variants.filter(
          (v) => v.quantity <= product.lowStockThreshold
        )

        if (lowStockVariants.length > 0) {
          isLowStock = true
          productData.variants = lowStockVariants.map((v) => ({
            id: v.id,
            name: v.name,
            value: v.value,
            currentStock: v.quantity,
          }))
        }
      } else {
        // Check product quantity for low stock
        if (product.quantity <= product.lowStockThreshold) {
          isLowStock = true
        }
      }

      // Add to vendor's low stock list
      if (isLowStock) {
        const vendorStoreId = product.vendorStore.id
        if (!vendorLowStockMap.has(vendorStoreId)) {
          vendorLowStockMap.set(vendorStoreId, [])
        }
        vendorLowStockMap
          .get(vendorStoreId)!
          .push({ ...productData, vendorStore: product.vendorStore })
      }
    }

    logger.info(
      `Found ${vendorLowStockMap.size} vendors with low stock items`
    )

    // Send alerts to vendors
    let emailsSent = 0
    let emailsFailed = 0
    const errors: string[] = []

    for (const [vendorStoreId, products] of vendorLowStockMap.entries()) {
      const vendorStore = products[0].vendorStore
      const vendorUser = vendorStore.User

      if (!vendorUser?.email) {
        logger.error(
          `No email found for vendor store ${vendorStoreId}, skipping alert`
        )
        continue
      }

      try {
        await sendLowStockAlert({
          vendorName: vendorUser.name || "Vendor",
          vendorEmail: vendorUser.email,
          storeName: vendorStore.name,
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            currentStock: p.currentStock,
            lowStockThreshold: p.lowStockThreshold,
            imageUrl: p.imageUrl,
            hasVariants: p.hasVariants,
            variants: p.variants,
          })),
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/products`,
        })

        emailsSent++
        logger.info(
          `✅ Low stock alert sent to ${vendorUser.email} for store ${vendorStore.name} (${products.length} items)`
        )
      } catch (error) {
        emailsFailed++
        const errorMsg = `Failed to send low stock alert to ${vendorUser.email}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
        logger.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    // Summary
    const summary = {
      success: true,
      productsChecked: lowStockProducts.length,
      vendorsWithLowStock: vendorLowStockMap.size,
      totalLowStockItems: Array.from(vendorLowStockMap.values()).reduce(
        (sum, products) => sum + products.length,
        0
      ),
      emailsSent,
      emailsFailed,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    }

    logger.info("Low stock check completed:", { data: JSON.stringify(summary, null, 2) })

    return NextResponse.json(summary)
  } catch (error) {
    logger.error("Cron job error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check low stock",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Allow GET for testing (only in development)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "GET method only available in development" },
      { status: 403 }
    )
  }

  // In development, allow GET without auth for testing
  return POST(request)
}
