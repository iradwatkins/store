import { NextRequest } from "next/server"
import { z } from "zod"
import Stripe from "stripe"
import prisma from "@/lib/db"
import { sendWelcomeVendor } from "@/lib/email"
import { logger } from "@/lib/logger"
import {
  requireAuth,
  handleApiError,
  successResponse,
} from "@/lib/utils/api"
import { BusinessLogicError } from "@/lib/errors"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
})

const createStoreSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  tagline: z.string().max(100).optional(),
  description: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  shipFromAddress: z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    // Validate input
    const validatedData = createStoreSchema.parse(body)

    // Check if slug is already taken
    const existingStore = await prisma.vendor_stores.findUnique({
      where: {
        slug: validatedData.slug,
      },
    })

    if (existingStore) {
      throw new BusinessLogicError("Store URL is already taken")
    }

    // Check if user already has a store
    const userStore = await prisma.vendor_stores.findFirst({
      where: {
        userId: session.user.id,
      },
    })

    if (userStore) {
      throw new BusinessLogicError("You already have a store")
    }

    // Use default platform fee (can be made configurable later)
    const platformFeePercent = 7.0

    // Create Stripe Connect account
    let stripeAccountId: string | null = null
    let stripeOnboardingUrl: string | null = null

    try {
      const stripeAccount = await stripe.accounts.create({
        type: "express",
        email: validatedData.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          userId: session.user.id,
          storeName: validatedData.name,
        },
      })

      stripeAccountId = stripeAccount.id

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/create-store?refresh=true`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?onboarding=complete`,
        type: "account_onboarding",
      })

      stripeOnboardingUrl = accountLink.url
    } catch (stripeError) {
      logger.error("Stripe account creation failed:", stripeError)
      // Continue without Stripe - can be set up later
    }

    // First create the Store registry entry
    const storeRegistry = await prisma.Store.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        ownerId: session.user.id,
        isActive: false, // Will be activated after Stripe onboarding
      },
    })

    // Create vendor store with link to Store registry
    const store = await prisma.vendor_stores.create({
      data: {
        storeId: storeRegistry.id,
        userId: session.user.id,
        name: validatedData.name,
        slug: validatedData.slug,
        tagline: validatedData.tagline,
        description: validatedData.description,
        email: validatedData.email,
        phone: validatedData.phone,
        shipFromAddress: validatedData.shipFromAddress,
        stripeAccountId,
        platformFeePercent,
        isActive: false, // Will be activated after Stripe onboarding
      },
    })

    // Upgrade user to STORE_OWNER role
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'STORE_OWNER' }
    })
    logger.info(`✅ User ${session.user.id} upgraded to STORE_OWNER role`)

    // Audit logging can be added later if needed
    logger.info(`Store created: ${store.slug} by user ${session.user.id}`)

    // Send welcome email to vendor
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true },
      })

      if (user) {
        await sendWelcomeVendor({
          vendorName: user.name || "Vendor",
          vendorEmail: user.email,
          storeName: store.name,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        })
        logger.info(`Welcome email sent to ${user.email}`)
      }
    } catch (emailError) {
      logger.error("Failed to send welcome email:", emailError)
      // Don't fail the store creation if email fails
    }

    return successResponse(
      {
        message: "Store created successfully",
        store: {
          id: store.id,
          name: store.name,
          slug: store.slug,
        },
        stripeOnboardingUrl,
      },
      201
    )
  } catch (error) {
    return handleApiError(error, 'Create store')
  }
}

export async function GET() {
  try {
    const session = await requireAuth()

    // Get user's store
    const store = await prisma.vendor_stores.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            Product: true,
            StoreOrder: true,
          },
        },
      },
    })

    if (!store) {
      throw new BusinessLogicError("Store not found")
    }

    return successResponse({ store })
  } catch (error) {
    return handleApiError(error, 'Get store')
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    // Get user's store
    const existingStore = await prisma.vendor_stores.findFirst({
      where: {
        userId: session.user.id,
      },
    })

    if (!existingStore) {
      throw new BusinessLogicError("Store not found")
    }

    // Update store
    const store = await prisma.vendor_stores.update({
      where: {
        id: existingStore.id,
      },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        tagline: body.tagline,
        description: body.description,
      },
    })

    logger.info(`Store updated: ${store.slug} by user ${session.user.id}`)

    return successResponse({ store })
  } catch (error) {
    return handleApiError(error, 'Update store')
  }
}
