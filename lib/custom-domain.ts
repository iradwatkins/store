import { headers } from "next/headers"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

export interface TenantInfo {
  id: string
  slug: string
  name: string
  customDomain?: string | null
  isCustomDomain: boolean
}

/**
 * Get tenant information from current request
 * Supports both subdomains (nike.stepperslife.com) and custom domains (shop.nike.com)
 */
export async function getTenantFromRequest(): Promise<TenantInfo | null> {
  try {
    const headersList = await headers()
    const customDomain = headersList.get("x-custom-domain")
    const tenantSlug = headersList.get("x-tenant-slug")
    const isCustomDomain = headersList.get("x-is-custom-domain") === "true"

    // Case 1: Custom domain request
    if (isCustomDomain && customDomain) {
      logger.info(`🔍 Looking up tenant for custom domain: ${customDomain}`)

      const tenant = await prisma.tenants.findFirst({
        where: {
          customDomain: customDomain,
          customDomainVerified: true,
          customDomainStatus: "ACTIVE",
        },
        select: {
          id: true,
          slug: true,
          name: true,
          customDomain: true,
        },
      })

      if (tenant) {
        logger.info(`✅ Found tenant: ${tenant.slug} (${tenant.name})`)
        return {
          ...tenant,
          isCustomDomain: true,
        }
      }

      logger.info(`❌ No active tenant found for custom domain: ${customDomain}`)
      return null
    }

    // Case 2: Subdomain request
    if (tenantSlug) {
      logger.info(`🔍 Looking up tenant for subdomain: ${tenantSlug}`)

      const tenant = await prisma.tenants.findUnique({
        where: {
          slug: tenantSlug,
          isActive: true,
        },
        select: {
          id: true,
          slug: true,
          name: true,
          customDomain: true,
        },
      })

      if (tenant) {
        logger.info(`✅ Found tenant: ${tenant.slug} (${tenant.name})`)
        return {
          ...tenant,
          isCustomDomain: false,
        }
      }

      logger.info(`❌ No active tenant found for subdomain: ${tenantSlug}`)
      return null
    }

    // Case 3: Main domain (stores.stepperslife.com)
    logger.info("📍 Main domain request - no tenant")
    return null
  } catch (error) {
    logger.error("Error getting tenant from request:", error)
    return null
  }
}

/**
 * Get custom domain information for a tenant
 */
export async function getCustomDomainInfo(tenantId: string) {
  try {
    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        customDomain: true,
        customDomainVerified: true,
        customDomainStatus: true,
        sslCertificateStatus: true,
        sslCertificateExpiry: true,
      },
    })

    return tenant
  } catch (error) {
    logger.error("Error getting custom domain info:", error)
    return null
  }
}

/**
 * Check if a custom domain is available
 */
export async function isCustomDomainAvailable(
  domain: string,
  excludeTenantId?: string
): Promise<boolean> {
  try {
    const existingTenant = await prisma.tenants.findFirst({
      where: {
        customDomain: domain,
        ...(excludeTenantId && { id: { not: excludeTenantId } }),
      },
    })

    return !existingTenant
  } catch (error) {
    logger.error("Error checking custom domain availability:", error)
    return false
  }
}

/**
 * Get tenant by custom domain
 */
export async function getTenantByCustomDomain(domain: string) {
  try {
    const tenant = await prisma.tenants.findFirst({
      where: {
        customDomain: domain,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        customDomain: true,
        customDomainVerified: true,
        customDomainStatus: true,
        sslCertificateStatus: true,
        isActive: true,
      },
    })

    return tenant
  } catch (error) {
    logger.error("Error getting tenant by custom domain:", error)
    return null
  }
}

/**
 * Get the current domain (subdomain or custom domain) being accessed
 */
export async function getCurrentDomain(): Promise<{
  type: "subdomain" | "custom" | "main"
  value: string | null
}> {
  const headersList = await headers()
  const customDomain = headersList.get("x-custom-domain")
  const tenantSlug = headersList.get("x-tenant-slug")
  const isCustomDomain = headersList.get("x-is-custom-domain") === "true"

  if (isCustomDomain && customDomain) {
    return { type: "custom", value: customDomain }
  }

  if (tenantSlug) {
    return { type: "subdomain", value: tenantSlug }
  }

  return { type: "main", value: null }
}
