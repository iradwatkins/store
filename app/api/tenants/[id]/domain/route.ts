import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"
import crypto from "crypto"
import { logger } from "@/lib/logger"

// Validation schema for domain
const domainSchema = z.object({
  customDomain: z
    .string()
    .min(3, "Domain must be at least 3 characters")
    .max(253, "Domain must be less than 253 characters")
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i,
      "Invalid domain format"
    ),
})

// Blocked domains/patterns
const BLOCKED_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "stepperslife.com",
  "*.stepperslife.com",
  "example.com",
  "test.com",
  "internal",
  "local",
]

// Helper: Check if domain is blocked
function isDomainBlocked(domain: string): boolean {
  const lowerDomain = domain.toLowerCase()

  // Check exact matches
  if (BLOCKED_DOMAINS.includes(lowerDomain)) {
    return true
  }

  // Check if it's a subdomain of stepperslife.com
  if (lowerDomain.endsWith(".stepperslife.com")) {
    return true
  }

  // Check for localhost/internal patterns
  if (
    lowerDomain.includes("localhost") ||
    lowerDomain.includes("local.") ||
    lowerDomain.includes(".local") ||
    lowerDomain.includes("internal")
  ) {
    return true
  }

  // Check for IP addresses
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
  if (ipPattern.test(lowerDomain)) {
    return true
  }

  return false
}

// Helper: Generate verification token
function generateVerificationToken(): string {
  const randomString = crypto.randomBytes(16).toString("hex")
  return `stepperslife-verify-${randomString}`
}

// Helper: Check rate limit (simple in-memory for now)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(tenantId: string): { allowed: boolean; resetIn?: number } {
  const now = Date.now()
  const limit = rateLimitMap.get(tenantId)

  // Reset if time window passed (1 hour)
  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(tenantId, { count: 1, resetAt: now + 3600000 }) // 1 hour
    return { allowed: true }
  }

  // Check if under limit (5 attempts per hour)
  if (limit.count < 5) {
    limit.count++
    return { allowed: true }
  }

  // Rate limited
  const resetIn = Math.ceil((limit.resetAt - now) / 1000 / 60) // minutes
  return { allowed: false, resetIn }
}

// POST /api/tenants/[id]/domain - Add custom domain
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Check rate limit
    const rateLimit = checkRateLimit(params.id)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Too many domain verification attempts. Please try again in ${rateLimit.resetIn} minutes.`,
        },
        { status: 429 }
      )
    }

    // 3. Verify tenant exists and user has permission
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        ownerId: true,
        slug: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        customDomain: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Check ownership
    if (tenant.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to manage this tenant" },
        { status: 403 }
      )
    }

    // 4. Check if plan allows custom domains (ENTERPRISE only)
    if (tenant.subscriptionPlan !== "ENTERPRISE") {
      return NextResponse.json(
        {
          error: "Custom domains are only available on ENTERPRISE plan",
          currentPlan: tenant.subscriptionPlan,
          message: "Upgrade to ENTERPRISE to use custom domains",
        },
        { status: 403 }
      )
    }

    // Check if subscription is active
    if (tenant.subscriptionStatus !== "ACTIVE") {
      return NextResponse.json(
        {
          error: "Active subscription required",
          message: "Your subscription must be active to add a custom domain",
        },
        { status: 403 }
      )
    }

    // 5. Parse and validate domain
    const body = await request.json()
    const validation = domainSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid domain format",
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { customDomain } = validation.data

    // 6. Check if domain is blocked
    if (isDomainBlocked(customDomain)) {
      return NextResponse.json(
        {
          error: "Domain not allowed",
          message: "This domain cannot be used as a custom domain",
        },
        { status: 400 }
      )
    }

    // 7. Check if domain is already claimed by another tenant
    const existingDomain = await prisma.tenant.findFirst({
      where: {
        customDomain: customDomain,
        id: { not: params.id },
      },
      select: { slug: true },
    })

    if (existingDomain) {
      return NextResponse.json(
        {
          error: "Domain already in use",
          message: "This domain is already claimed by another store",
        },
        { status: 409 }
      )
    }

    // 8. Generate verification token
    const verificationToken = generateVerificationToken()

    // 9. Update tenant with domain and token
    const updatedTenant = await prisma.tenant.update({
      where: { id: params.id },
      data: {
        customDomain: customDomain,
        customDomainVerified: false,
        customDomainStatus: "PENDING",
        customDomainDnsRecord: verificationToken,
        sslCertificateStatus: "PENDING",
        sslCertificateExpiry: null,
        sslLastCheckedAt: null,
      },
      select: {
        id: true,
        slug: true,
        customDomain: true,
        customDomainStatus: true,
        customDomainDnsRecord: true,
      },
    })

    // 10. Return DNS setup instructions
    return NextResponse.json({
      success: true,
      message: "Custom domain added successfully",
      domain: updatedTenant.customDomain,
      status: updatedTenant.customDomainStatus,
      dnsInstructions: {
        type: "CNAME",
        host: customDomain.replace(/\.[^.]+\.[^.]+$/, ""), // Extract subdomain
        value: `${tenant.slug}.stepperslife.com`,
        verificationToken: verificationToken,
        ttl: 3600,
        steps: [
          `1. Log in to your domain registrar (e.g., GoDaddy, Namecheap, Cloudflare)`,
          `2. Navigate to DNS settings for ${customDomain}`,
          `3. Add a CNAME record:`,
          `   - Type: CNAME`,
          `   - Name/Host: ${customDomain.split(".")[0]} (or @ if using root domain)`,
          `   - Value/Target: ${tenant.slug}.stepperslife.com`,
          `   - TTL: 3600 (or Auto)`,
          `4. Add a TXT record for verification:`,
          `   - Type: TXT`,
          `   - Name/Host: _stepperslife-verification`,
          `   - Value: ${verificationToken}`,
          `   - TTL: 3600 (or Auto)`,
          `5. Save changes and wait 5-10 minutes for DNS propagation`,
          `6. Click "Verify DNS" in your dashboard to check configuration`,
        ],
      },
      nextSteps: [
        "Configure DNS records as instructed above",
        "Wait for DNS propagation (usually 5-10 minutes, can take up to 48 hours)",
        "Click 'Verify DNS' in your domain settings",
        "Once verified, SSL certificate will be automatically provisioned",
        "Your custom domain will be active within 15 minutes of verification",
      ],
    })
  } catch (error) {
    logger.error("Error adding custom domain:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to add custom domain" },
      { status: 500 }
    )
  }
}

// DELETE /api/tenants/[id]/domain - Remove custom domain
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Verify tenant exists and user has permission
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        ownerId: true,
        customDomain: true,
        customDomainStatus: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Check ownership
    if (tenant.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to manage this tenant" },
        { status: 403 }
      )
    }

    // 3. Check if tenant has a custom domain
    if (!tenant.customDomain) {
      return NextResponse.json(
        { error: "No custom domain configured" },
        { status: 400 }
      )
    }

    // 4. Store the domain being removed for response
    const removedDomain = tenant.customDomain

    // 5. Remove domain and reset all related fields
    await prisma.tenant.update({
      where: { id: params.id },
      data: {
        customDomain: null,
        customDomainVerified: false,
        customDomainStatus: "PENDING",
        customDomainDnsRecord: null,
        sslCertificateStatus: "PENDING",
        sslCertificateExpiry: null,
        sslLastCheckedAt: null,
      },
    })

    // 6. Clear rate limit for this tenant
    rateLimitMap.delete(params.id)

    // 7. Return success response
    return NextResponse.json({
      success: true,
      message: "Custom domain removed successfully",
      removedDomain: removedDomain,
      note: "Your store will continue to be accessible at your original subdomain",
    })
  } catch (error) {
    logger.error("Error removing custom domain:", error)
    return NextResponse.json(
      { error: "Failed to remove custom domain" },
      { status: 500 }
    )
  }
}

// GET /api/tenants/[id]/domain - Get custom domain configuration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Verify tenant exists and user has permission
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        ownerId: true,
        slug: true,
        customDomain: true,
        customDomainVerified: true,
        customDomainStatus: true,
        customDomainDnsRecord: true,
        sslCertificateStatus: true,
        sslCertificateExpiry: true,
        sslLastCheckedAt: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Check ownership
    if (tenant.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to view this tenant" },
        { status: 403 }
      )
    }

    // 3. Return domain configuration
    return NextResponse.json({
      tenantId: tenant.id,
      slug: tenant.slug,
      customDomain: tenant.customDomain,
      customDomainVerified: tenant.customDomainVerified,
      domainStatus: tenant.customDomainStatus,
      verificationToken: tenant.customDomainDnsRecord,
      sslStatus: tenant.sslCertificateStatus,
      sslExpiry: tenant.sslCertificateExpiry,
      sslLastChecked: tenant.sslLastCheckedAt,
      subscriptionPlan: tenant.subscriptionPlan,
      subscriptionStatus: tenant.subscriptionStatus,
      canAddCustomDomain:
        tenant.subscriptionPlan === "ENTERPRISE" &&
        tenant.subscriptionStatus === "ACTIVE",
    })
  } catch (error) {
    logger.error("Error fetching domain configuration:", error)
    return NextResponse.json(
      { error: "Failed to fetch domain configuration" },
      { status: 500 }
    )
  }
}
