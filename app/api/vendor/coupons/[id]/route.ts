import { NextRequest } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import {
  requireAuth,
  requireVendorStore,
  handleApiError,
  successResponse,
} from "@/lib/utils/api"
import { BusinessLogicError } from "@/lib/errors"

const updateCouponSchema = z.object({
  description: z.string().optional(),
  discountValue: z.number().positive("Discount value must be positive").optional(),
  minPurchaseAmount: z.number().positive().optional().nullable(),
  maxDiscountAmount: z.number().positive().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  perCustomerLimit: z.number().int().positive().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  applicableProducts: z.array(z.string()).optional(),
  applicableCategories: z.array(z.string()).optional(),
  excludedProducts: z.array(z.string()).optional(),
  firstTimeCustomersOnly: z.boolean().optional(),
})

// GET /api/vendor/coupons/[id] - Get single coupon
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    // Get coupon
    const coupon = await prisma.coupons.findFirst({
      where: {
        id: params.id,
        vendorStoreId: vendorStore.id,
      },
    })

    if (!coupon) {
      throw new BusinessLogicError("Coupon not found")
    }

    return successResponse({ coupon })
  } catch (error) {
    return handleApiError(error, 'Fetch coupon')
  }
}

// PUT /api/vendor/coupons/[id] - Update coupon
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    // Check if coupon exists and belongs to vendor
    const existingCoupon = await prisma.coupons.findFirst({
      where: {
        id: params.id,
        vendorStoreId: vendorStore.id,
      },
    })

    if (!existingCoupon) {
      throw new BusinessLogicError("Coupon not found")
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateCouponSchema.parse(body)

    // Validate discount value if being updated
    if (
      validatedData.discountValue !== undefined &&
      existingCoupon.discountType === "PERCENTAGE"
    ) {
      if (validatedData.discountValue > 100) {
        throw new BusinessLogicError("Percentage discount cannot exceed 100%")
      }
    }

    // Validate date range if being updated
    const startDate = validatedData.startDate
      ? new Date(validatedData.startDate)
      : existingCoupon.startDate
    const endDate = validatedData.endDate
      ? new Date(validatedData.endDate)
      : existingCoupon.endDate

    if (startDate && endDate && endDate <= startDate) {
      throw new BusinessLogicError("End date must be after start date")
    }

    // Build update data
    const updateData: any = {}
    if (validatedData.description !== undefined)
      {updateData.description = validatedData.description}
    if (validatedData.discountValue !== undefined)
      {updateData.discountValue = validatedData.discountValue}
    if (validatedData.minPurchaseAmount !== undefined)
      {updateData.minPurchaseAmount = validatedData.minPurchaseAmount}
    if (validatedData.maxDiscountAmount !== undefined)
      {updateData.maxDiscountAmount = validatedData.maxDiscountAmount}
    if (validatedData.usageLimit !== undefined)
      {updateData.usageLimit = validatedData.usageLimit}
    if (validatedData.perCustomerLimit !== undefined)
      {updateData.perCustomerLimit = validatedData.perCustomerLimit}
    if (validatedData.startDate !== undefined)
      {updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null}
    if (validatedData.endDate !== undefined)
      {updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null}
    if (validatedData.isActive !== undefined)
      {updateData.isActive = validatedData.isActive}
    if (validatedData.applicableProducts !== undefined)
      {updateData.applicableProducts = validatedData.applicableProducts}
    if (validatedData.applicableCategories !== undefined)
      {updateData.applicableCategories = validatedData.applicableCategories}
    if (validatedData.excludedProducts !== undefined)
      {updateData.excludedProducts = validatedData.excludedProducts}
    if (validatedData.firstTimeCustomersOnly !== undefined)
      {updateData.firstTimeCustomersOnly = validatedData.firstTimeCustomersOnly}

    // Update coupon
    const coupon = await prisma.coupons.update({
      where: { id: params.id },
      data: updateData,
    })

    return successResponse({ coupon })
  } catch (error) {
    return handleApiError(error, 'Update coupon')
  }
}

// DELETE /api/vendor/coupons/[id] - Delete coupon
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    // Check if coupon exists and belongs to vendor
    const existingCoupon = await prisma.coupons.findFirst({
      where: {
        id: params.id,
        vendorStoreId: vendorStore.id,
      },
    })

    if (!existingCoupon) {
      throw new BusinessLogicError("Coupon not found")
    }

    // Delete coupon
    await prisma.coupons.delete({
      where: { id: params.id },
    })

    return successResponse({ message: "Coupon deleted successfully" })
  } catch (error) {
    return handleApiError(error, 'Delete coupon')
  }
}
