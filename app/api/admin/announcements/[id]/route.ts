import { NextRequest } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import {
  requireAdmin,
  handleApiError,
  successResponse,
} from "@/lib/utils/api"
import { NotFoundError, ValidationError } from "@/lib/errors"

const updateAnnouncementSchema = z.object({
  title: z.string().min(3).optional(),
  content: z.string().min(10).optional(),
  targetType: z.enum(["ALL_VENDORS", "SPECIFIC_VENDORS"]).optional(),
  targetVendors: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).optional(),
  publishAt: z.string().nullable().optional(),
})

// GET /api/admin/announcements/[id] - Get single announcement
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const announcement = await prisma.announcements.findUnique({
      where: { id: params.id },
      include: {
        User: { select: { name: true, email: true } },
        _count: { select: { announcement_reads: true } },
      },
    })

    if (!announcement) {
      throw new NotFoundError('Announcement not found')
    }

    return successResponse({
      announcement: {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        targetType: announcement.targetType,
        targetVendors: announcement.targetVendors,
        status: announcement.status,
        publishAt: announcement.publishAt?.toISOString() || null,
        createdAt: announcement.createdAt.toISOString(),
        author: announcement.User,
        readCount: announcement._count.announcement_reads,
      },
    })
  } catch (error) {
    return handleApiError(error, 'Fetch announcement (admin)')
  }
}

// PATCH /api/admin/announcements/[id] - Update announcement
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const body = await request.json()
    const validatedData = updateAnnouncementSchema.parse(body)

    const announcement = await prisma.announcements.update({
      where: { id: params.id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.content && { content: validatedData.content }),
        ...(validatedData.targetType && { targetType: validatedData.targetType }),
        ...(validatedData.targetVendors && { targetVendors: validatedData.targetVendors }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.publishAt !== undefined && {
          publishAt: validatedData.publishAt ? new Date(validatedData.publishAt) : null,
        }),
      },
    })

    return successResponse({
      message: "Announcement updated successfully",
      announcement: {
        id: announcement.id,
        title: announcement.title,
        status: announcement.status,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation error', error.issues)
    }
    return handleApiError(error, 'Update announcement (admin)')
  }
}

// DELETE /api/admin/announcements/[id] - Delete announcement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    await prisma.announcements.delete({
      where: { id: params.id },
    })

    return successResponse({ message: "Announcement deleted successfully" })
  } catch (error) {
    return handleApiError(error, 'Delete announcement (admin)')
  }
}
