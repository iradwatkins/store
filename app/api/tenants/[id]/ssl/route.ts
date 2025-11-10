import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"
import {
  requestCertificate,
  getCertificateInfo,
  renewCertificate,
  revokeCertificate,
} from "@/lib/certbot"

// POST /api/tenants/[id]/ssl - Request SSL certificate
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
    const tenant = await prisma.tenants.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        ownerId: true,
        customDomain: true,
        customDomainVerified: true,
        customDomainStatus: true,
        sslCertificateStatus: true,
        owner: {
          select: {
            email: true,
          },
        },
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

    // 3. Verify custom domain is configured and verified
    if (!tenant.customDomain) {
      return NextResponse.json(
        { error: "No custom domain configured" },
        { status: 400 }
      )
    }

    if (!tenant.customDomainVerified || tenant.customDomainStatus !== "VERIFIED") {
      return NextResponse.json(
        {
          error: "Domain must be verified before requesting SSL certificate",
          currentStatus: tenant.customDomainStatus,
        },
        { status: 400 }
      )
    }

    // 4. Check if SSL is already active
    if (tenant.sslCertificateStatus === "ACTIVE") {
      return NextResponse.json(
        {
          error: "SSL certificate is already active",
          message: "Use PUT to renew the certificate",
        },
        { status: 400 }
      )
    }

    // 5. Update status to REQUESTING
    await prisma.tenants.update({
      where: { id: params.id },
      data: {
        sslCertificateStatus: "REQUESTING",
        sslLastCheckedAt: new Date(),
      },
    })

    // 6. Request SSL certificate
    logger.info(`Requesting SSL certificate for ${tenant.customDomain}`)

    const certResult = await requestCertificate(
      tenant.customDomain,
      tenant.owner.email || "ssl@stepperslife.com"
    )

    // 7. Update tenant based on result
    if (certResult.success) {
      // Get certificate info to get expiry date
      const certInfo = await getCertificateInfo(tenant.customDomain)

      await prisma.tenants.update({
        where: { id: params.id },
        data: {
          sslCertificateStatus: "ACTIVE",
          sslCertificateExpiry: certInfo.expiryDate || null,
          sslLastCheckedAt: new Date(),
          customDomainStatus: "ACTIVE", // Also update domain status to ACTIVE
        },
      })

      return NextResponse.json({
        success: true,
        message: "SSL certificate successfully issued",
        domain: tenant.customDomain,
        sslStatus: "ACTIVE",
        expiryDate: certInfo.expiryDate,
        daysUntilExpiry: certInfo.daysUntilExpiry,
        certificatePath: certResult.certificatePath,
      })
    } else {
      // Certificate request failed
      await prisma.tenants.update({
        where: { id: params.id },
        data: {
          sslCertificateStatus: "FAILED",
          sslLastCheckedAt: new Date(),
        },
      })

      return NextResponse.json(
        {
          success: false,
          message: certResult.message,
          domain: tenant.customDomain,
          sslStatus: "FAILED",
          error: certResult.error,
          details: {
            stdout: certResult.stdout,
            stderr: certResult.stderr,
          },
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    logger.error("Error requesting SSL certificate:", error)

    // Revert status to PENDING on error
    try {
      await prisma.tenants.update({
        where: { id: params.id },
        data: {
          sslCertificateStatus: "PENDING",
        },
      })
    } catch (updateError) {
      logger.error("Failed to revert SSL status:", updateError)
    }

    return NextResponse.json(
      {
        error: "Failed to request SSL certificate",
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// GET /api/tenants/[id]/ssl - Get SSL certificate status
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
    const tenant = await prisma.tenants.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        ownerId: true,
        customDomain: true,
        customDomainVerified: true,
        customDomainStatus: true,
        sslCertificateStatus: true,
        sslCertificateExpiry: true,
        sslLastCheckedAt: true,
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
      return NextResponse.json({
        configured: false,
        message: "No custom domain configured",
        sslStatus: "PENDING",
      })
    }

    // 4. Get fresh certificate info from Certbot
    let certInfo = null
    if (tenant.sslCertificateStatus === "ACTIVE") {
      certInfo = await getCertificateInfo(tenant.customDomain)

      // Update database if expiry changed or certificate expired
      if (certInfo.exists && certInfo.expiryDate) {
        const needsUpdate =
          !tenant.sslCertificateExpiry ||
          certInfo.expiryDate.getTime() !==
            new Date(tenant.sslCertificateExpiry).getTime() ||
          (certInfo.daysUntilExpiry !== undefined &&
            certInfo.daysUntilExpiry <= 0)

        if (needsUpdate) {
          const newStatus =
            certInfo.daysUntilExpiry !== undefined &&
            certInfo.daysUntilExpiry <= 0
              ? "EXPIRED"
              : "ACTIVE"

          await prisma.tenants.update({
            where: { id: params.id },
            data: {
              sslCertificateStatus: newStatus,
              sslCertificateExpiry: certInfo.expiryDate,
              sslLastCheckedAt: new Date(),
            },
          })
        }
      }
    }

    // 5. Return SSL status
    return NextResponse.json({
      configured: true,
      domain: tenant.customDomain,
      domainVerified: tenant.customDomainVerified,
      domainStatus: tenant.customDomainStatus,
      sslStatus: tenant.sslCertificateStatus,
      sslExpiry: tenant.sslCertificateExpiry,
      sslLastChecked: tenant.sslLastCheckedAt,
      certificateInfo: certInfo
        ? {
            exists: certInfo.exists,
            isValid: certInfo.isValid,
            daysUntilExpiry: certInfo.daysUntilExpiry,
            expiryDate: certInfo.expiryDate,
          }
        : null,
    })
  } catch (error: any) {
    logger.error("Error fetching SSL status:", error)
    return NextResponse.json(
      { error: "Failed to fetch SSL status", message: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/tenants/[id]/ssl - Renew SSL certificate
export async function PUT(
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
    const tenant = await prisma.tenants.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        ownerId: true,
        customDomain: true,
        sslCertificateStatus: true,
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
        { error: "No custom domain configured" },
        { status: 400 }
      )
    }

    // 4. Check if SSL certificate exists
    if (tenant.sslCertificateStatus === "PENDING") {
      return NextResponse.json(
        {
          error: "No SSL certificate to renew",
          message: "Use POST to request a new certificate",
        },
        { status: 400 }
      )
    }

    // 5. Renew certificate
    logger.info(`Renewing SSL certificate for ${tenant.customDomain}`)

    const renewResult = await renewCertificate(tenant.customDomain)

    // 6. Update tenant based on result
    if (renewResult.success) {
      // Get updated certificate info
      const certInfo = await getCertificateInfo(tenant.customDomain)

      await prisma.tenants.update({
        where: { id: params.id },
        data: {
          sslCertificateStatus: "ACTIVE",
          sslCertificateExpiry: certInfo.expiryDate || null,
          sslLastCheckedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: renewResult.message,
        domain: tenant.customDomain,
        sslStatus: "ACTIVE",
        expiryDate: certInfo.expiryDate,
        daysUntilExpiry: certInfo.daysUntilExpiry,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: renewResult.message,
          error: renewResult.error,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    logger.error("Error renewing SSL certificate:", error)
    return NextResponse.json(
      {
        error: "Failed to renew SSL certificate",
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// DELETE /api/tenants/[id]/ssl - Revoke SSL certificate
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
    const tenant = await prisma.tenants.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        ownerId: true,
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

    // 3. Check if custom domain is configured
    if (!tenant.customDomain) {
      return NextResponse.json(
        { error: "No custom domain configured" },
        { status: 400 }
      )
    }

    // 4. Revoke certificate
    logger.info(`Revoking SSL certificate for ${tenant.customDomain}`)

    await revokeCertificate(tenant.customDomain)

    // 5. Update tenant
    await prisma.tenants.update({
      where: { id: params.id },
      data: {
        sslCertificateStatus: "PENDING",
        sslCertificateExpiry: null,
        sslLastCheckedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "SSL certificate revoked successfully",
      domain: tenant.customDomain,
    })
  } catch (error: any) {
    logger.error("Error revoking SSL certificate:", error)
    return NextResponse.json(
      {
        error: "Failed to revoke SSL certificate",
        message: error.message,
      },
      { status: 500 }
    )
  }
}
