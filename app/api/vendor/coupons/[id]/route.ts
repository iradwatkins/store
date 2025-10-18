import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

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
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get vendor store
    const vendorStore = await prisma.vendorStore.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!vendorStore) {
      return NextResponse.json({ error: "Vendor store not found" }, { status: 404 })
    }

    // Get coupon
    const coupon = await prisma.coupon.findFirst({
      where: {
        id: params.id,
        vendorStoreId: vendorStore.id,
      },
    })

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error("Error fetching coupon:", error)
    return NextResponse.json(
      { error: "Failed to fetch coupon" },
      { status: 500 }
    )
  }
}

// PUT /api/vendor/coupons/[id] - Update coupon
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get vendor store
    const vendorStore = await prisma.vendorStore.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!vendorStore) {
      return NextResponse.json({ error: "Vendor store not found" }, { status: 404 })
    }

    // Check if coupon exists and belongs to vendor
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        id: params.id,
        vendorStoreId: vendorStore.id,
      },
    })

    if (!existingCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
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
        return NextResponse.json(
          { error: "Percentage discount cannot exceed 100%" },
          { status: 400 }
        )
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
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: any = {}
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description
    if (validatedData.discountValue !== undefined)
      updateData.discountValue = validatedData.discountValue
    if (validatedData.minPurchaseAmount !== undefined)
      updateData.minPurchaseAmount = validatedData.minPurchaseAmount
    if (validatedData.maxDiscountAmount !== undefined)
      updateData.maxDiscountAmount = validatedData.maxDiscountAmount
    if (validatedData.usageLimit !== undefined)
      updateData.usageLimit = validatedData.usageLimit
    if (validatedData.perCustomerLimit !== undefined)
      updateData.perCustomerLimit = validatedData.perCustomerLimit
    if (validatedData.startDate !== undefined)
      updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null
    if (validatedData.endDate !== undefined)
      updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null
    if (validatedData.isActive !== undefined)
      updateData.isActive = validatedData.isActive
    if (validatedData.applicableProducts !== undefined)
      updateData.applicableProducts = validatedData.applicableProducts
    if (validatedData.applicableCategories !== undefined)
      updateData.applicableCategories = validatedData.applicableCategories
    if (validatedData.excludedProducts !== undefined)
      updateData.excludedProducts = validatedData.excludedProducts
    if (validatedData.firstTimeCustomersOnly !== undefined)
      updateData.firstTimeCustomersOnly = validatedData.firstTimeCustomersOnly

    // Update coupon
    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ coupon })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating coupon:", error)
    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    )
  }
}

// DELETE /api/vendor/coupons/[id] - Delete coupon
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get vendor store
    const vendorStore = await prisma.vendorStore.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!vendorStore) {
      return NextResponse.json({ error: "Vendor store not found" }, { status: 404 })
    }

    // Check if coupon exists and belongs to vendor
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        id: params.id,
        vendorStoreId: vendorStore.id,
      },
    })

    if (!existingCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    // Delete coupon
    await prisma.coupon.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: "Coupon deleted successfully" })
  } catch (error) {
    console.error("Error deleting coupon:", error)
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    )
  }
}
