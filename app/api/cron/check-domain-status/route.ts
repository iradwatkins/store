import { promisify } from "util"
import dns from "dns"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

// Promisify DNS lookup functions
const resolveCname = promisify(dns.resolveCname)
const resolveTxt = promisify(dns.resolveTxt)

interface DomainCheckResult {
  tenantId: string
  tenantSlug: string
  domain: string
  previousStatus: string
  newStatus: string
  cnameValid: boolean
  txtValid: boolean
  updated: boolean
  error?: string
}

// Helper: Check single domain's DNS configuration
async function checkDomainDns(
  domain: string,
  expectedTarget: string,
  verificationToken: string
): Promise<{ cnameValid: boolean; txtValid: boolean; error?: string }> {
  let cnameValid = false
  let txtValid = false
  let error: string | undefined

  try {
    // Check CNAME record
    try {
      const cnameRecords = await resolveCname(domain)
      if (cnameRecords && cnameRecords.length > 0) {
        const cnameTarget = cnameRecords[0].toLowerCase()
        const expected = expectedTarget.toLowerCase()

        if (cnameTarget === expected || cnameTarget === `${expected}.`) {
          cnameValid = true
        }
      }
    } catch (cnameError: any) {
      // CNAME check failed - will be reflected in cnameValid = false
      if (!error) {error = `CNAME: ${cnameError.code || cnameError.message}`}
    }

    // Check TXT record
    const txtRecordHost = `_stepperslife-verification.${domain}`
    try {
      const txtRecords = await resolveTxt(txtRecordHost)
      if (txtRecords && txtRecords.length > 0) {
        const allTxtValues = txtRecords.flat().map((record) => record.trim())
        const matchFound = allTxtValues.some(
          (record) => record === verificationToken
        )
        if (matchFound) {
          txtValid = true
        }
      }
    } catch (txtError: any) {
      // TXT check failed
      if (!error) {error = `TXT: ${txtError.code || txtError.message}`}
    }
  } catch (err: any) {
    error = err.message
  }

  return { cnameValid, txtValid, error }
}

// GET /api/cron/check-domain-status - Check all domains that need verification
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

    logger.info("🔍 Starting domain status check cron job...")

    // Find all tenants with custom domains that need checking
    const tenantsToCheck = await prisma.tenants.findMany({
      where: {
        customDomain: { not: null },
        customDomainStatus: {
          in: ["PENDING", "VERIFYING", "FAILED"],
        },
      },
      select: {
        id: true,
        slug: true,
        customDomain: true,
        customDomainStatus: true,
        customDomainDnsRecord: true,
        customDomainVerified: true,
      },
    })

    logger.info(`📋 Found ${tenantsToCheck.length} domains to check`)

    const results: DomainCheckResult[] = []

    // Check each domain
    for (const tenant of tenantsToCheck) {
      if (!tenant.customDomain || !tenant.customDomainDnsRecord) {
        continue
      }

      const result: DomainCheckResult = {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        domain: tenant.customDomain,
        previousStatus: tenant.customDomainStatus,
        newStatus: tenant.customDomainStatus,
        cnameValid: false,
        txtValid: false,
        updated: false,
      }

      try {
        // Perform DNS check
        const dnsCheck = await checkDomainDns(
          tenant.customDomain,
          `${tenant.slug}.stepperslife.com`,
          tenant.customDomainDnsRecord
        )

        result.cnameValid = dnsCheck.cnameValid
        result.txtValid = dnsCheck.txtValid
        result.error = dnsCheck.error

        // Determine new status based on DNS check
        let newStatus = tenant.customDomainStatus
        const _verified = tenant.customDomainVerified

        if (dnsCheck.cnameValid && dnsCheck.txtValid) {
          // DNS is valid - mark as VERIFIED
          if (tenant.customDomainStatus !== "VERIFIED") {
            newStatus = "VERIFIED"
            const _verified = true
            result.updated = true

            logger.info(
              `✅ Domain verified: ${tenant.customDomain} (${tenant.slug})`
            )

            // Update tenant in database
            await prisma.tenants.update({
              where: { id: tenant.id },
              data: {
                customDomainStatus: "VERIFIED",
                customDomainVerified: true,
              },
            })
          }
        } else {
          // DNS is not valid
          if (
            tenant.customDomainStatus === "PENDING" ||
            tenant.customDomainStatus === "FAILED"
          ) {
            // Keep as PENDING/FAILED - no change
            logger.info(
              `⏳ Domain still pending: ${tenant.customDomain} (${tenant.slug})`
            )
          } else if (tenant.customDomainStatus === "VERIFYING") {
            // Mark as FAILED after verification attempt
            newStatus = "FAILED"
            result.updated = true

            logger.info(
              `❌ Domain verification failed: ${tenant.customDomain} (${tenant.slug})`
            )

            await prisma.tenants.update({
              where: { id: tenant.id },
              data: {
                customDomainStatus: "FAILED",
              },
            })
          }
        }

        result.newStatus = newStatus
      } catch (error: any) {
        logger.error(
          `Error checking domain ${tenant.customDomain}:`,
          error.message
        )
        result.error = error.message
      }

      results.push(result)
    }

    // Summary
    const verified = results.filter((r) => r.newStatus === "VERIFIED").length
    const failed = results.filter((r) => r.newStatus === "FAILED").length
    const pending = results.filter(
      (r) => r.newStatus === "PENDING" || r.newStatus === "VERIFYING"
    ).length
    const updated = results.filter((r) => r.updated).length

    logger.info(
      `✅ Domain check complete: ${verified} verified, ${failed} failed, ${pending} pending (${updated} updated)`
    )

    return NextResponse.json({
      success: true,
      message: "Domain status check complete",
      timestamp: new Date().toISOString(),
      summary: {
        total: tenantsToCheck.length,
        verified,
        failed,
        pending,
        updated,
      },
      results: results.map((r) => ({
        domain: r.domain,
        status: r.newStatus,
        updated: r.updated,
        checks: {
          cname: r.cnameValid,
          txt: r.txtValid,
        },
        error: r.error,
      })),
    })
  } catch (error: any) {
    logger.error("Domain status check cron job failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Domain status check failed",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// POST /api/cron/check-domain-status - Manually trigger check (admin only)
export async function POST(request: NextRequest) {
  // Reuse the GET logic
  return GET(request)
}
