import { headers } from "next/headers"
import prisma from "@/lib/db"

/**
 * Get the current tenant based on subdomain from middleware
 * Returns null if no tenant found or on main domain
 */
export async function getCurrentTenant() {
  const headersList = headers()
  const tenantSlug = headersList.get("x-tenant-slug")

  if (!tenantSlug) {
    return null
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: {
        slug: tenantSlug,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        logoUrl: true,
        primaryColor: true,
        maxProducts: true,
        maxOrders: true,
        maxStorageGB: true,
        currentProducts: true,
        currentOrders: true,
        currentStorageGB: true,
        platformFeePercent: true,
        customDomain: true,
        customDomainVerified: true,
        trialEndsAt: true,
        isActive: true,
        ownerId: true,
      },
    })

    return tenant
  } catch (error) {
    console.error("Error fetching tenant:", error)
    return null
  }
}

/**
 * Get tenant slug from request headers (use in API routes)
 */
export function getTenantSlug(request: Request): string | null {
  // Try to get from custom header set by middleware
  const tenantSlug = request.headers.get("x-tenant-slug")

  if (tenantSlug) {
    return tenantSlug
  }

  // Fallback: Extract from hostname
  const hostname = request.headers.get("host") || ""
  const parts = hostname.split(".")
  const subdomain = parts[0]

  // Skip main domains
  if (subdomain === "stores" || subdomain === "www" || hostname.includes("localhost")) {
    return null
  }

  return subdomain
}

/**
 * Validate if current request is from tenant's owner
 */
export async function isCurrentTenantOwner(userId: string): Promise<boolean> {
  const tenant = await getCurrentTenant()

  if (!tenant) {
    return false
  }

  return tenant.ownerId === userId
}

/**
 * Get tenant by slug (for use in API routes)
 */
export async function getTenantBySlug(slug: string) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: {
        slug,
        isActive: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        vendorStores: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
      },
    })

    return tenant
  } catch (error) {
    console.error("Error fetching tenant by slug:", error)
    return null
  }
}
