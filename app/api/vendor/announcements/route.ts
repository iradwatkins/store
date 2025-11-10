import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import {
  requireAuth,
  requireVendorStore,
  getPaginationParams,
  handleApiError,
} from "@/lib/utils/api"

// GET /api/vendor/announcements - List announcements for vendor
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    // Pagination
    const { page, limit, skip } = getPaginationParams(request.nextUrl.searchParams)
    const unreadOnly = request.nextUrl.searchParams.get("unreadOnly") === "true"

    const now = new Date()

    // Build where clause for announcements
    const where: any = {
      status: "PUBLISHED",
      AND: [
        {
          OR: [
            { publishAt: null },
            { publishAt: { lte: now } }
          ]
        },
        {
          OR: [
            { targetType: "ALL_VENDORS" },
            {
              AND: [
                { targetType: "SPECIFIC_VENDORS" },
                { targetVendors: { has: vendorStore.id } }
              ]
            }
          ]
        }
      ]
    }

    // Fetch announcements with read status
    const [announcements, total] = await Promise.all([
      prisma.announcements.findMany({
        where,
        include: {
          announcement_reads: {
            where: { vendorStoreId: vendorStore.id },
          },
          User: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.announcements.count({ where }),
    ])

    // Filter unread if requested
    let filteredAnnouncements = announcements
    if (unreadOnly) {
      filteredAnnouncements = announcements.filter(a => a.announcement_reads.length === 0)
    }

    // Get unread count
    const unreadCount = announcements.filter(a => a.announcement_reads.length === 0).length

    return NextResponse.json({
      announcements: filteredAnnouncements.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
        publishAt: a.publishAt?.toISOString() || null,
        isRead: a.announcement_reads.length > 0,
        readAt: a.announcement_reads[0]?.readAt.toISOString() || null,
        author: {
          name: a.User.name,
          email: a.User.email,
        },
      })),
      unreadCount,
      pagination: {
        page,
        limit,
        total: unreadOnly ? unreadCount : total,
        totalPages: Math.ceil((unreadOnly ? unreadCount : total) / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, 'Fetch announcements')
  }
}
