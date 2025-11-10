import { NextRequest } from "next/server"
import prisma from "@/lib/db"
import {
  requireAdmin,
  handleApiError,
  successResponse,
} from "@/lib/utils/api"

// GET /api/admin/withdraws - List all withdraw requests
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    // Get query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "all"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status !== "all") {
      where.status = status
    }

    // Fetch withdraws with vendor store info
    const [withdraws, total] = await Promise.all([
      prisma.vendor_withdraws.findMany({
        where,
        include: {
          vendor_stores: {
            select: {
              id: true,
              name: true,
              slug: true,
              email: true,
              User: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { requestedAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.vendor_withdraws.count({ where }),
    ])

    return successResponse({
      withdraws: withdraws.map((w) => ({
        id: w.id,
        amount: Number(w.amount),
        method: w.method,
        status: w.status,
        requestedAt: w.requestedAt.toISOString(),
        processedAt: w.processedAt?.toISOString() || null,
        notes: w.notes,
        adminNotes: w.adminNotes,
        vendor_stores: {
          id: w.vendor_stores.id,
          name: w.vendor_stores.name,
          slug: w.vendor_stores.slug,
          email: w.vendor_stores.email,
          ownerName: w.vendor_stores.User.name,
          ownerEmail: w.vendor_stores.User.email,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, 'Fetch withdraws (admin)')
  }
}
