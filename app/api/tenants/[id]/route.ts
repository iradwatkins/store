import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

// Validation schema for tenant updates
const updateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  customDomain: z.string().min(3).max(253).optional(),
  isActive: z.boolean().optional(),
})

// GET /api/tenants/[id] - Get tenant details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenant = await prisma.tenants.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
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
        subscriptionHistory: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Check authorization (owner or admin)
    const isAdmin = session.user.role === "ADMIN"
    const isOwner = tenant.ownerId === session.user.id

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ tenant })
  } catch (error) {
    logger.error("Error fetching tenant:", error)
    return NextResponse.json({ error: "Failed to fetch tenant" }, { status: 500 })
  }
}

// PATCH /api/tenants/[id] - Update tenant
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if tenant exists and user has permission
    const existingTenant = await prisma.tenants.findUnique({
      where: { id: params.id },
    })

    if (!existingTenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    const isAdmin = session.user.role === "ADMIN"
    const isOwner = existingTenant.ownerId === session.user.id

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validated = updateTenantSchema.parse(body)

    // If updating custom domain, reset verification status
    const updateData: any = {
      ...validated,
    }

    if (validated.customDomain && validated.customDomain !== existingTenant.customDomain) {
      updateData.customDomainVerified = false
      updateData.sslCertificateStatus = "PENDING"
    }

    const tenant = await prisma.tenants.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json({ tenant })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }

    logger.error("Error updating tenant:", error)
    return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 })
  }
}

// DELETE /api/tenants/[id] - Delete tenant (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can delete tenants
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
    }

    // Check if tenant exists
    const existingTenant = await prisma.tenants.findUnique({
      where: { id: params.id },
      include: {
        vendorStores: true,
      },
    })

    if (!existingTenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Prevent deletion if tenant has active stores
    if (existingTenant.vendorStores.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete tenant with active stores. Delete stores first." },
        { status: 409 }
      )
    }

    await prisma.tenants.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: "Tenant deleted successfully" })
  } catch (error) {
    logger.error("Error deleting tenant:", error)
    return NextResponse.json({ error: "Failed to delete tenant" }, { status: 500 })
  }
}
