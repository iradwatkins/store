import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"
import { logger } from "@/lib/logger"

// Validation schema for tenant creation
const createTenantSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  subscriptionPlan: z.enum(["TRIAL", "STARTER", "PRO", "ENTERPRISE"]).default("TRIAL"),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

// GET /api/tenants - List tenants (admin only or owned tenants)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const isAdmin = session.user.role === "ADMIN"

    // Admins can see all tenants, users see only their own
    const tenants = await prisma.tenant.findMany({
      where: isAdmin ? {} : { ownerId: session.user.id },
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        customDomain: true,
        customDomainVerified: true,
        currentProducts: true,
        maxProducts: true,
        currentOrders: true,
        maxOrders: true,
        isActive: true,
        createdAt: true,
        trialEndsAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ tenants })
  } catch (error) {
    logger.error("Error fetching tenants:", error)
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 })
  }
}

// POST /api/tenants - Create new tenant
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = createTenantSchema.parse(body)

    // Check if slug is already taken
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: validated.slug },
    })

    if (existingTenant) {
      return NextResponse.json(
        { error: "This subdomain is already taken. Please choose another." },
        { status: 409 }
      )
    }

    // Set quotas based on subscription plan
    const quotasByPlan = {
      TRIAL: { maxProducts: 10, maxOrders: 20, maxStorageGB: 0.5, platformFeePercent: 7.0 },
      STARTER: { maxProducts: 50, maxOrders: 100, maxStorageGB: 1.0, platformFeePercent: 5.0 },
      PRO: { maxProducts: 500, maxOrders: 1000, maxStorageGB: 10.0, platformFeePercent: 3.0 },
      ENTERPRISE: {
        maxProducts: 999999,
        maxOrders: 999999,
        maxStorageGB: 100.0,
        platformFeePercent: 2.0,
      },
    }

    const quotas = quotasByPlan[validated.subscriptionPlan]

    // Set trial end date (14 days from now)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        ownerId: session.user.id,
        subscriptionPlan: validated.subscriptionPlan,
        subscriptionStatus: "TRIAL",
        logoUrl: validated.logoUrl,
        primaryColor: validated.primaryColor || "#10b981",
        maxProducts: quotas.maxProducts,
        maxOrders: quotas.maxOrders,
        maxStorageGB: quotas.maxStorageGB,
        platformFeePercent: quotas.platformFeePercent,
        trialEndsAt: validated.subscriptionPlan === "TRIAL" ? trialEndsAt : null,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // TODO: Send welcome email
    // TODO: Create Stripe customer (if not trial)

    return NextResponse.json({ tenant }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    logger.error("Error creating tenant:", error)
    return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 })
  }
}
