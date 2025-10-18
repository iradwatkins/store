import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { promisify } from "util"
import dns from "dns"

// Promisify DNS lookup functions
const resolveCname = promisify(dns.resolveCname)
const resolveTxt = promisify(dns.resolveTxt)
const resolve4 = promisify(dns.resolve4)

interface DnsVerificationResult {
  cnameValid: boolean
  cnameValue?: string
  cnameError?: string
  txtValid: boolean
  txtValue?: string
  txtError?: string
  overallValid: boolean
  message: string
}

// Helper: Verify DNS configuration
async function verifyDnsConfiguration(
  customDomain: string,
  tenantSlug: string,
  verificationToken: string
): Promise<DnsVerificationResult> {
  const result: DnsVerificationResult = {
    cnameValid: false,
    txtValid: false,
    overallValid: false,
    message: "",
  }

  try {
    // 1. Check CNAME record
    try {
      const cnameRecords = await resolveCname(customDomain)

      if (cnameRecords && cnameRecords.length > 0) {
        const cnameTarget = cnameRecords[0].toLowerCase()
        const expectedTarget = `${tenantSlug}.stepperslife.com`.toLowerCase()

        result.cnameValue = cnameTarget

        if (
          cnameTarget === expectedTarget ||
          cnameTarget === `${expectedTarget}.`
        ) {
          result.cnameValid = true
        } else {
          result.cnameError = `CNAME points to ${cnameTarget}, expected ${expectedTarget}`
        }
      } else {
        result.cnameError = "No CNAME record found"
      }
    } catch (error: any) {
      // CNAME not found, check if it's an A record pointing directly
      if (error.code === "ENODATA" || error.code === "ENOTFOUND") {
        try {
          // Check if domain resolves to our server (alternative configuration)
          const aRecords = await resolve4(customDomain)
          if (aRecords && aRecords.length > 0) {
            result.cnameError = `Domain uses A record (${aRecords[0]}). Please use CNAME instead.`
          } else {
            result.cnameError = "No DNS records found for this domain"
          }
        } catch {
          result.cnameError = "Domain does not resolve. DNS records not found."
        }
      } else {
        result.cnameError = `DNS lookup failed: ${error.message}`
      }
    }

    // 2. Check TXT record for verification token
    const txtRecordHost = `_stepperslife-verification.${customDomain}`

    try {
      const txtRecords = await resolveTxt(txtRecordHost)

      if (txtRecords && txtRecords.length > 0) {
        // Flatten the array of arrays and join
        const allTxtValues = txtRecords.flat().map((record) => record.trim())

        result.txtValue = allTxtValues.join(", ")

        // Check if any TXT record matches our verification token
        const matchFound = allTxtValues.some(
          (record) => record === verificationToken
        )

        if (matchFound) {
          result.txtValid = true
        } else {
          result.txtError = `TXT record found but token doesn't match. Expected: ${verificationToken}`
        }
      } else {
        result.txtError = "No TXT record found for verification"
      }
    } catch (error: any) {
      if (error.code === "ENODATA" || error.code === "ENOTFOUND") {
        result.txtError = `TXT record not found at ${txtRecordHost}`
      } else {
        result.txtError = `TXT lookup failed: ${error.message}`
      }
    }

    // 3. Determine overall validity
    result.overallValid = result.cnameValid && result.txtValid

    if (result.overallValid) {
      result.message = "DNS configuration verified successfully!"
    } else {
      const errors: string[] = []
      if (!result.cnameValid) errors.push(result.cnameError || "CNAME invalid")
      if (!result.txtValid) errors.push(result.txtError || "TXT invalid")
      result.message = `Verification failed: ${errors.join(", ")}`
    }
  } catch (error: any) {
    result.message = `DNS verification error: ${error.message}`
  }

  return result
}

// POST /api/tenants/[id]/domain/verify - Verify DNS configuration
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

    // 2. Verify tenant exists and user has permission
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        ownerId: true,
        slug: true,
        customDomain: true,
        customDomainStatus: true,
        customDomainDnsRecord: true,
        customDomainVerified: true,
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

    // 3. Check if custom domain is configured
    if (!tenant.customDomain) {
      return NextResponse.json(
        { error: "No custom domain configured for this tenant" },
        { status: 400 }
      )
    }

    // 4. Check if already verified
    if (
      tenant.customDomainVerified &&
      tenant.customDomainStatus === "VERIFIED"
    ) {
      return NextResponse.json(
        {
          success: true,
          message: "Domain already verified",
          domain: tenant.customDomain,
          status: tenant.customDomainStatus,
          verified: true,
        },
        { status: 200 }
      )
    }

    // 5. Update status to VERIFYING
    await prisma.tenant.update({
      where: { id: params.id },
      data: {
        customDomainStatus: "VERIFYING",
      },
    })

    // 6. Perform DNS verification
    const verificationResult = await verifyDnsConfiguration(
      tenant.customDomain,
      tenant.slug,
      tenant.customDomainDnsRecord || ""
    )

    // 7. Update tenant based on verification result
    if (verificationResult.overallValid) {
      // DNS verification successful
      await prisma.tenant.update({
        where: { id: params.id },
        data: {
          customDomainVerified: true,
          customDomainStatus: "VERIFIED",
        },
      })

      return NextResponse.json({
        success: true,
        message: "Domain verified successfully!",
        domain: tenant.customDomain,
        status: "VERIFIED",
        verified: true,
        verification: {
          cname: {
            valid: verificationResult.cnameValid,
            value: verificationResult.cnameValue,
          },
          txt: {
            valid: verificationResult.txtValid,
            value: verificationResult.txtValue,
          },
        },
        nextSteps: [
          "SSL certificate provisioning will begin automatically",
          "Certificate issuance takes 5-15 minutes",
          "You'll receive an email when your domain is fully active",
          "Check back in 15 minutes to see your custom domain live",
        ],
      })
    } else {
      // DNS verification failed
      await prisma.tenant.update({
        where: { id: params.id },
        data: {
          customDomainStatus: "FAILED",
        },
      })

      return NextResponse.json(
        {
          success: false,
          message: verificationResult.message,
          domain: tenant.customDomain,
          status: "FAILED",
          verified: false,
          verification: {
            cname: {
              valid: verificationResult.cnameValid,
              value: verificationResult.cnameValue,
              error: verificationResult.cnameError,
            },
            txt: {
              valid: verificationResult.txtValid,
              value: verificationResult.txtValue,
              error: verificationResult.txtError,
            },
          },
          troubleshooting: [
            "Ensure CNAME record points to: " + tenant.slug + ".stepperslife.com",
            "Ensure TXT record at _stepperslife-verification contains: " +
              tenant.customDomainDnsRecord,
            "DNS propagation can take 5-10 minutes (up to 48 hours in rare cases)",
            "Try again after waiting a few minutes",
            "Use a DNS checker tool (e.g., dnschecker.org) to verify propagation",
          ],
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error("Error verifying DNS:", error)

    // Revert status back to PENDING on error
    try {
      await prisma.tenant.update({
        where: { id: params.id },
        data: {
          customDomainStatus: "PENDING",
        },
      })
    } catch (updateError) {
      console.error("Failed to revert status:", updateError)
    }

    return NextResponse.json(
      {
        error: "Failed to verify DNS configuration",
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// GET /api/tenants/[id]/domain/verify - Check current verification status
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
        customDomainStatus: true,
        customDomainVerified: true,
        customDomainDnsRecord: true,
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

    // 3. Check if custom domain is configured
    if (!tenant.customDomain) {
      return NextResponse.json(
        {
          configured: false,
          message: "No custom domain configured",
        },
        { status: 200 }
      )
    }

    // 4. Return current status
    return NextResponse.json({
      configured: true,
      domain: tenant.customDomain,
      verified: tenant.customDomainVerified,
      status: tenant.customDomainStatus,
      verificationToken: tenant.customDomainDnsRecord,
      dnsChecks: {
        cname: {
          host: tenant.customDomain,
          expected: `${tenant.slug}.stepperslife.com`,
        },
        txt: {
          host: `_stepperslife-verification.${tenant.customDomain}`,
          expected: tenant.customDomainDnsRecord,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching verification status:", error)
    return NextResponse.json(
      { error: "Failed to fetch verification status" },
      { status: 500 }
    )
  }
}
