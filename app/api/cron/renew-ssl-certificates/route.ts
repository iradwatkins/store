import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getCertificateInfo, renewCertificate, reloadNginx } from "@/lib/certbot"
import { logger } from "@/lib/logger"

interface RenewalResult {
  tenantId: string
  domain: string
  previousExpiry?: Date
  newExpiry?: Date
  daysUntilExpiry?: number
  renewed: boolean
  status: string
  message: string
  error?: string
}

// GET /api/cron/renew-ssl-certificates - Automatically renew expiring certificates
export async function GET(request: NextRequest) {
  try {
    // Optional: Add cron secret authentication in production
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid cron secret" },
        { status: 401 }
      )
    }

    logger.info("🔐 Starting SSL certificate renewal cron job...")

    // Find all tenants with ACTIVE SSL certificates
    const tenantsWithSSL = await prisma.tenant.findMany({
      where: {
        customDomain: { not: null },
        sslCertificateStatus: {
          in: ["ACTIVE", "EXPIRED"],
        },
      },
      select: {
        id: true,
        customDomain: true,
        sslCertificateStatus: true,
        sslCertificateExpiry: true,
        sslLastCheckedAt: true,
      },
    })

    logger.info(`📋 Found ${tenantsWithSSL.length} tenants with SSL certificates`)

    const results: RenewalResult[] = []
    let needsNginxReload = false

    // Check each certificate
    for (const tenant of tenantsWithSSL) {
      if (!tenant.customDomain) continue

      const result: RenewalResult = {
        tenantId: tenant.id,
        domain: tenant.customDomain,
        previousExpiry: tenant.sslCertificateExpiry || undefined,
        renewed: false,
        status: tenant.sslCertificateStatus,
        message: "",
      }

      try {
        // Get current certificate info
        const certInfo = await getCertificateInfo(tenant.customDomain)

        if (!certInfo.exists) {
          result.status = "FAILED"
          result.message = "Certificate not found"
          result.error = certInfo.error

          // Update database
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              sslCertificateStatus: "FAILED",
              sslLastCheckedAt: new Date(),
            },
          })

          results.push(result)
          continue
        }

        result.daysUntilExpiry = certInfo.daysUntilExpiry

        // Check if certificate is expired or expiring soon (< 30 days)
        const shouldRenew =
          certInfo.daysUntilExpiry !== undefined &&
          certInfo.daysUntilExpiry < 30

        if (!shouldRenew) {
          result.message = `Certificate valid for ${certInfo.daysUntilExpiry} days - no renewal needed`
          logger.info(`✅ ${tenant.customDomain}: ${result.message}`)

          // Update last checked time
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              sslLastCheckedAt: new Date(),
            },
          })

          results.push(result)
          continue
        }

        // Certificate needs renewal
        logger.info(
          `🔄 ${tenant.customDomain}: Certificate expires in ${certInfo.daysUntilExpiry} days - renewing...`
        )

        const renewResult = await renewCertificate(tenant.customDomain)

        if (renewResult.success) {
          // Get updated certificate info
          const updatedCertInfo = await getCertificateInfo(tenant.customDomain)

          result.renewed = true
          result.newExpiry = updatedCertInfo.expiryDate
          result.daysUntilExpiry = updatedCertInfo.daysUntilExpiry
          result.status = "ACTIVE"
          result.message = "Certificate renewed successfully"

          logger.info(
            `✅ ${tenant.customDomain}: Renewed! New expiry: ${updatedCertInfo.expiryDate?.toISOString()}`
          )

          // Update database
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              sslCertificateStatus: "ACTIVE",
              sslCertificateExpiry: updatedCertInfo.expiryDate || null,
              sslLastCheckedAt: new Date(),
            },
          })

          needsNginxReload = true
        } else {
          // Renewal failed
          result.status = "FAILED"
          result.message = renewResult.message
          result.error = renewResult.error

          logger.error(
            `❌ ${tenant.customDomain}: Renewal failed - ${renewResult.message}`
          )

          // Update database
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              sslCertificateStatus: "FAILED",
              sslLastCheckedAt: new Date(),
            },
          })
        }
      } catch (error: any) {
        logger.error(
          `Error processing certificate for ${tenant.customDomain}:`,
          error.message
        )
        result.status = "FAILED"
        result.message = "Error during renewal process"
        result.error = error.message
      }

      results.push(result)
    }

    // Reload Nginx if any certificates were renewed
    let nginxReloaded = false
    if (needsNginxReload) {
      logger.info("🔄 Reloading Nginx to apply renewed certificates...")
      const reloadResult = await reloadNginx()

      if (reloadResult.success) {
        nginxReloaded = true
        logger.info("✅ Nginx reloaded successfully")
      } else {
        logger.error("❌ Failed to reload Nginx:", reloadResult.message)
      }
    }

    // Summary
    const renewed = results.filter((r) => r.renewed).length
    const failed = results.filter((r) => r.status === "FAILED").length
    const valid = results.filter(
      (r) => r.status === "ACTIVE" && !r.renewed
    ).length

    logger.info(
      `✅ SSL renewal complete: ${renewed} renewed, ${valid} valid, ${failed} failed`
    )

    return NextResponse.json({
      success: true,
      message: "SSL certificate renewal complete",
      timestamp: new Date().toISOString(),
      summary: {
        total: tenantsWithSSL.length,
        renewed,
        valid,
        failed,
        nginxReloaded,
      },
      results: results.map((r) => ({
        domain: r.domain,
        status: r.status,
        renewed: r.renewed,
        daysUntilExpiry: r.daysUntilExpiry,
        previousExpiry: r.previousExpiry,
        newExpiry: r.newExpiry,
        message: r.message,
        error: r.error,
      })),
    })
  } catch (error: any) {
    logger.error("SSL renewal cron job failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "SSL renewal failed",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// POST /api/cron/renew-ssl-certificates - Manually trigger renewal (admin only)
export async function POST(request: NextRequest) {
  // Reuse the GET logic
  return GET(request)
}
