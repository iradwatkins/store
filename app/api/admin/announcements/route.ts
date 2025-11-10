import { NextRequest } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import {
  requireAdmin,
  handleApiError,
  successResponse,
} from "@/lib/utils/api"
import { ValidationError, BusinessLogicError } from "@/lib/errors"

const createAnnouncementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  targetType: z.enum(["ALL_VENDORS", "SPECIFIC_VENDORS"]),
  targetVendors: z.array(z.string()).optional(),
  publishAt: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]).default("PUBLISHED"),
})

// GET /api/admin/announcements - List all announcements
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

    // Fetch announcements
    const [announcements, total] = await Promise.all([
      prisma.announcements.findMany({
        where,
        include: {
          User: {
            select: {
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              announcement_reads: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.announcements.count({ where }),
    ])

    return successResponse({
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        targetType: a.targetType,
        targetVendors: a.targetVendors,
        status: a.status,
        publishAt: a.publishAt?.toISOString() || null,
        createdAt: a.createdAt.toISOString(),
        author: {
          name: a.User.name,
          email: a.User.email,
        },
        readCount: a._count.announcement_reads,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, 'Fetch announcements (admin)')
  }
}

// POST /api/admin/announcements - Create new announcement
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()

    // Parse and validate request
    const body = await request.json()
    const validatedData = createAnnouncementSchema.parse(body)

    // Validate target vendors if SPECIFIC_VENDORS
    if (validatedData.targetType === "SPECIFIC_VENDORS") {
      if (!validatedData.targetVendors || validatedData.targetVendors.length === 0) {
        throw new BusinessLogicError('Target vendors are required for SPECIFIC_VENDORS type')
      }
    }

    // Create announcement
    const announcement = await prisma.announcements.create({
      data: {
        id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: validatedData.title,
        content: validatedData.content,
        targetType: validatedData.targetType,
        targetVendors: validatedData.targetVendors || [],
        status: validatedData.status,
        publishAt: validatedData.publishAt ? new Date(validatedData.publishAt) : null,
        createdBy: session.user.id,
      },
    })

    return successResponse(
      {
        message: "Announcement created successfully",
        announcement: {
          id: announcement.id,
          title: announcement.title,
          status: announcement.status,
          createdAt: announcement.createdAt.toISOString(),
        },
      },
      201
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation error', error.issues)
    }
    return handleApiError(error, 'Create announcement (admin)')
  }
}
