import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { cookies } from "next/headers"
import { redisHelpers } from "@/lib/redis"
import prisma from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"
import { checkStockAvailability } from "@/lib/stock-management"

const addToCartSchema = z.object({
  productId: z.string(),
  // Old single-variant system
  variantId: z.string().nullable().optional(),
  // New multi-variant system
  variantCombinationId: z.string().nullable().optional(),
  // Selected add-ons
  addons: z
    .array(
      z.object({
        addonId: z.string(),
        quantity: z.number().int().min(1).default(1),
      })
    )
    .optional(),
  quantity: z.number().int().min(1).max(10),
  storeSlug: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (60 requests per minute per IP)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    const rateLimitResult = await checkRateLimit(`cart:${ip}`, 60, 60)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const body = await request.json()
    const validatedData = addToCartSchema.parse(body)

    // Get or create cart session ID
    const cookieStore = await cookies()
    let cartId = cookieStore.get("cart_id")?.value

    if (!cartId) {
      cartId = randomUUID()
    }

    // Fetch product details
    const product = await prisma.products.findFirst({
      where: {
        id: validatedData.productId,
        status: "ACTIVE",
      },
      include: {
        product_images: {
          orderBy: {
            sortOrder: "asc",
          },
          take: 1,
        },
        product_variants: true, // Old variant system
        variantCombinations: true, // New multi-variant system
        vendor_stores: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Handle old single-variant system
    let variant = null
    if (validatedData.variantId) {
      variant = product.product_variants.find((v) => v.id === validatedData.variantId)
      if (!variant) {
        return NextResponse.json({ error: "Variant not found" }, { status: 404 })
      }
    }

    // Handle new multi-variant system
    let variantCombination = null
    if (validatedData.variantCombinationId) {
      variantCombination = product.variantCombinations.find(
        (vc) => vc.id === validatedData.variantCombinationId
      )
      if (!variantCombination) {
        return NextResponse.json(
          { error: "Variant combination not found" },
          { status: 404 }
        )
      }
      if (!variantCombination.available) {
        return NextResponse.json(
          { error: "This variant is not available" },
          { status: 400 }
        )
      }
    }

    // Fetch and validate addons if provided
    const selectedAddons: any[] = []
    let addonsTotal = 0
    if (validatedData.addons && validatedData.addons.length > 0) {
      const addonIds = validatedData.addons.map((a) => a.addonId)
      const addons = await prisma.product_addons.findMany({
        where: {
          id: { in: addonIds },
          productId: validatedData.productId,
          isActive: true,
        },
      })

      for (const requestedAddon of validatedData.addons) {
        const addon = addons.find((a) => a.id === requestedAddon.addonId)
        if (!addon) {
          return NextResponse.json(
            { error: `Addon ${requestedAddon.addonId} not found` },
            { status: 404 }
          )
        }

        selectedAddons.push({
          addonId: addon.id,
          name: addon.name,
          price: addon.price.toNumber(),
          quantity: requestedAddon.quantity,
        })

        addonsTotal += addon.price.toNumber() * requestedAddon.quantity
      }
    }

    // Check inventory using advanced stock management
    if (product.trackInventory) {
      const stockCheck = await checkStockAvailability(
        product.id,
        validatedData.quantity,
        variant?.id || undefined,
        variantCombination?.id || undefined
      )

      if (!stockCheck.available) {
        return NextResponse.json(
          {
            error: `Only ${stockCheck.quantity} items available`,
          },
          { status: 400 }
        )
      }
    }

    // Get current cart
    const cart = await redisHelpers.getCart(cartId) || { items: [], storeSlug: validatedData.storeSlug }

    // Verify all items are from the same store
    if (cart.storeSlug && cart.storeSlug !== validatedData.storeSlug) {
      // Fetch store names for enriched error response
      const [currentStore, attemptedStore] = await Promise.all([
        prisma.vendor_stores.findUnique({
          where: { slug: cart.storeSlug },
          select: { name: true },
        }),
        prisma.vendor_stores.findUnique({
          where: { slug: validatedData.storeSlug },
          select: { name: true },
        }),
      ])

      // Calculate cart total
      const cartTotal = cart.items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      )

      return NextResponse.json(
        {
          error: "different_store",
          message: "You can only add items from one store at a time.",
          currentCart: {
            storeSlug: cart.storeSlug,
            storeName: currentStore?.name || "Unknown Store",
            itemCount: cart.items.length,
            total: cartTotal,
          },
          attemptedStore: {
            storeSlug: validatedData.storeSlug,
            storeName: attemptedStore?.name || "Unknown Store",
          },
        },
        { status: 400 }
      )
    }

    // Create cart item
    // Generate unique cart item ID based on product + variant/combination + addons
    let cartItemId = product.id
    if (variantCombination) {
      cartItemId = `${product.id}-${variantCombination.id}`
    } else if (variant) {
      cartItemId = `${product.id}-${variant.id}`
    }
    if (selectedAddons.length > 0) {
      const addonIds = selectedAddons.map((a) => a.addonId).join("-")
      cartItemId = `${cartItemId}-addons-${addonIds}`
    }

    // Calculate price
    let itemPrice = product.price.toNumber()
    if (variantCombination?.price) {
      itemPrice = variantCombination.price.toNumber()
    } else if (variant?.price) {
      itemPrice = variant.price.toNumber()
    }

    // Total item price including addons
    const totalItemPrice = itemPrice + addonsTotal

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item: any) => item.cartItemId === cartItemId
    )

    if (existingItemIndex >= 0) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + validatedData.quantity

      // Check if new quantity exceeds inventory
      if (product.trackInventory) {
        const stockCheck = await checkStockAvailability(
          product.id,
          newQuantity,
          variant?.id || undefined,
          variantCombination?.id || undefined
        )

        if (!stockCheck.available) {
          return NextResponse.json(
            {
              error: `Only ${stockCheck.quantity} items available`,
            },
            { status: 400 }
          )
        }
      }

      cart.items[existingItemIndex].quantity = Math.min(newQuantity, 10)
    } else {
      // Add new item
      const cartItem: any = {
        cartItemId,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        // Old variant system
        variantId: variant?.id || null,
        variantName: variant?.name || null,
        // New multi-variant system
        variantCombinationId: variantCombination?.id || null,
        variantCombinationKey: variantCombination?.combinationKey || null,
        variantOptions: variantCombination?.optionValues || null,
        // Pricing
        basePrice: itemPrice,
        addonsTotal: addonsTotal,
        price: totalItemPrice,
        // Add-ons
        addons: selectedAddons,
        quantity: validatedData.quantity,
        image: variantCombination?.imageUrl || product.product_images[0]?.url || null,
        storeSlug: validatedData.storeSlug,
      }
      cart.items.push(cartItem)
    }

    cart.storeSlug = validatedData.storeSlug

    // Save cart to Redis (7 days TTL)
    await redisHelpers.setCart(cartId, cart, 604800)

    // Create response with cart cookie
    const response = NextResponse.json({
      message: "Item added to cart",
      cart,
    })

    response.cookies.set("cart_id", cartId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 604800, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    logger.error("Add to cart error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
