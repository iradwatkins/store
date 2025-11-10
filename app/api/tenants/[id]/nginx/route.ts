import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"
import {
  generateNginxConfig,
  writeNginxConfig,
  removeNginxConfig,
  updateNginxConfigWithSSL,
  reloadNginx,
  nginxConfigExists,
} from "@/lib/nginx"

const UPSTREAM_PORT = 3008 // Stores app port

// POST /api/tenants/[id]/nginx - Generate and apply Nginx configuration
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
        slug: true,
        customDomain: true,
        customDomainVerified: true,
        customDomainStatus: true,
        sslCertificateStatus: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Check ownership (allow admins)
    const isAdmin = (session.user as any).role === "ADMIN"
    if (tenant.ownerId !== session.user.id && !isAdmin) {
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

    if (!tenant.customDomainVerified) {
      return NextResponse.json(
        {
          error: "Domain must be verified before generating Nginx config",
          currentStatus: tenant.customDomainStatus,
        },
        { status: 400 }
      )
    }

    // 4. Check if Nginx config already exists
    const configExists = await nginxConfigExists(tenant.customDomain)

    if (configExists) {
      return NextResponse.json(
        {
          error: "Nginx configuration already exists",
          message: "Use PUT to update the configuration",
        },
        { status: 409 }
      )
    }

    // 5. Determine if SSL is active
    const hasSSL = tenant.sslCertificateStatus === "ACTIVE"
    const certPath = hasSSL
      ? `/etc/letsencrypt/live/${tenant.customDomain}/fullchain.pem`
      : undefined
    const keyPath = hasSSL
      ? `/etc/letsencrypt/live/${tenant.customDomain}/privkey.pem`
      : undefined

    // 6. Generate Nginx configuration
    const nginxConfig = generateNginxConfig({
      domain: tenant.customDomain,
      tenantSlug: tenant.slug,
      sslCertificatePath: certPath,
      sslCertificateKeyPath: keyPath,
      upstreamPort: UPSTREAM_PORT,
    })

    // 7. Write Nginx configuration
    const writeResult = await writeNginxConfig(tenant.customDomain, nginxConfig)

    if (!writeResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: writeResult.message,
          error: writeResult.error,
        },
        { status: 500 }
      )
    }

    // 8. Reload Nginx
    const reloadResult = await reloadNginx()

    if (!reloadResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Configuration written but Nginx reload failed",
          error: reloadResult.error,
          warning: "Manual Nginx reload may be required",
        },
        { status: 500 }
      )
    }

    // 9. Update tenant domain status to ACTIVE if SSL is present
    if (hasSSL && tenant.customDomainStatus !== "ACTIVE") {
      await prisma.tenants.update({
        where: { id: params.id },
        data: {
          customDomainStatus: "ACTIVE",
        },
      })
    }

    // 10. Return success
    return NextResponse.json({
      success: true,
      message: "Nginx configuration created and applied successfully",
      domain: tenant.customDomain,
      configPath: writeResult.configPath,
      hasSSL: hasSSL,
      status: hasSSL ? "ACTIVE" : "VERIFIED",
    })
  } catch (error: any) {
    logger.error("Error generating Nginx config:", error)
    return NextResponse.json(
      {
        error: "Failed to generate Nginx configuration",
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// PUT /api/tenants/[id]/nginx - Update Nginx configuration (e.g., add SSL)
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
        slug: true,
        customDomain: true,
        sslCertificateStatus: true,
        customDomainStatus: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Check ownership
    const isAdmin = (session.user as any).role === "ADMIN"
    if (tenant.ownerId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: "Not authorized to manage this tenant" },
        { status: 403 }
      )
    }

    // 3. Verify custom domain is configured
    if (!tenant.customDomain) {
      return NextResponse.json(
        { error: "No custom domain configured" },
        { status: 400 }
      )
    }

    // 4. Check if Nginx config exists
    const configExists = await nginxConfigExists(tenant.customDomain)

    if (!configExists) {
      return NextResponse.json(
        {
          error: "Nginx configuration does not exist",
          message: "Use POST to create the configuration",
        },
        { status: 404 }
      )
    }

    // 5. Determine SSL status
    const hasSSL = tenant.sslCertificateStatus === "ACTIVE"

    if (!hasSSL) {
      return NextResponse.json(
        {
          error: "SSL certificate not active",
          message:
            "Request SSL certificate first before updating Nginx config",
        },
        { status: 400 }
      )
    }

    // 6. Update Nginx config with SSL
    const certPath = `/etc/letsencrypt/live/${tenant.customDomain}/fullchain.pem`
    const keyPath = `/etc/letsencrypt/live/${tenant.customDomain}/privkey.pem`

    const updateResult = await updateNginxConfigWithSSL(
      tenant.customDomain,
      tenant.slug,
      certPath,
      keyPath,
      UPSTREAM_PORT
    )

    if (!updateResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: updateResult.message,
          error: updateResult.error,
        },
        { status: 500 }
      )
    }

    // 7. Update tenant status to ACTIVE
    await prisma.tenants.update({
      where: { id: params.id },
      data: {
        customDomainStatus: "ACTIVE",
      },
    })

    // 8. Return success
    return NextResponse.json({
      success: true,
      message: "Nginx configuration updated with SSL successfully",
      domain: tenant.customDomain,
      status: "ACTIVE",
    })
  } catch (error: any) {
    logger.error("Error updating Nginx config:", error)
    return NextResponse.json(
      {
        error: "Failed to update Nginx configuration",
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// DELETE /api/tenants/[id]/nginx - Remove Nginx configuration
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
    const isAdmin = (session.user as any).role === "ADMIN"
    if (tenant.ownerId !== session.user.id && !isAdmin) {
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

    // 4. Remove Nginx configuration
    const removeResult = await removeNginxConfig(tenant.customDomain)

    if (!removeResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: removeResult.message,
          error: removeResult.error,
        },
        { status: 500 }
      )
    }

    // 5. Reload Nginx
    const reloadResult = await reloadNginx()

    if (!reloadResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Configuration removed but Nginx reload failed",
          error: reloadResult.error,
          warning: "Manual Nginx reload may be required",
        },
        { status: 500 }
      )
    }

    // 6. Return success
    return NextResponse.json({
      success: true,
      message: "Nginx configuration removed successfully",
      domain: tenant.customDomain,
    })
  } catch (error: any) {
    logger.error("Error removing Nginx config:", error)
    return NextResponse.json(
      {
        error: "Failed to remove Nginx configuration",
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// GET /api/tenants/[id]/nginx - Check Nginx configuration status
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
        customDomainStatus: true,
        sslCertificateStatus: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Check ownership
    const isAdmin = (session.user as any).role === "ADMIN"
    if (tenant.ownerId !== session.user.id && !isAdmin) {
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
      })
    }

    // 4. Check if Nginx config exists
    const configExists = await nginxConfigExists(tenant.customDomain)

    return NextResponse.json({
      configured: true,
      domain: tenant.customDomain,
      nginxConfigExists: configExists,
      domainStatus: tenant.customDomainStatus,
      sslStatus: tenant.sslCertificateStatus,
      configPath: configExists
        ? `/etc/nginx/sites-available/${tenant.customDomain}.conf`
        : null,
    })
  } catch (error: any) {
    logger.error("Error checking Nginx config status:", error)
    return NextResponse.json(
      { error: "Failed to check Nginx configuration status" },
      { status: 500 }
    )
  }
}
