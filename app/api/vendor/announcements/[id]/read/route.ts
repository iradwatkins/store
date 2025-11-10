import { NextRequest } from "next/server"
import prisma from "@/lib/db"
import {
  requireAuth,
  requireVendorStore,
  handleApiError,
  successResponse,
  generateId,
} from "@/lib/utils/api"
import { BusinessLogicError } from "@/lib/errors"

// POST /api/vendor/announcements/[id]/read - Mark announcement as read
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    // Check if announcement exists
    const announcement = await prisma.announcements.findUnique({
      where: { id: params.id },
    })

    if (!announcement) {
      throw new BusinessLogicError("Announcement not found")
    }

    // Create or update read record
    await prisma.announcement_reads.upsert({
      where: {
        announcementId_vendorStoreId: {
          announcementId: params.id,
          vendorStoreId: vendorStore.id,
        },
      },
      create: {
        id: generateId('anr'),
        announcementId: params.id,
        vendorStoreId: vendorStore.id,
      },
      update: {
        readAt: new Date(),
      },
    })

    return successResponse({ message: "Announcement marked as read" })
  } catch (error) {
    return handleApiError(error, 'Mark announcement as read')
  }
}
