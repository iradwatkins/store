import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import {
  requireAuth,
  requireVendorStore,
  getPaginationParams,
  buildPaginatedResponse,
  handleApiError,
  successResponse,
} from "@/lib/utils/api"
import { BusinessLogicError } from "@/lib/errors"

const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(50, "Code must be less than 50 characters")
    .regex(/^[A-Z0-9_-]+$/, "Code must be uppercase letters, numbers, hyphens, or underscores"),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]),
  discountValue: z.number().positive("Discount value must be positive"),
  minPurchaseAmount: z.number().positive().optional(),
  maxDiscountAmount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perCustomerLimit: z.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
  applicableProducts: z.array(z.string()).default([]),
  applicableCategories: z.array(z.string()).default([]),
  excludedProducts: z.array(z.string()).default([]),
  firstTimeCustomersOnly: z.boolean().default(false),
})

// GET /api/vendor/coupons - List all coupons for vendor's store
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    // Pagination
    const { page, limit, skip } = getPaginationParams(request.nextUrl.searchParams)

    // Build where clause
    const isActive = request.nextUrl.searchParams.get("isActive")
    const where: any = { vendorStoreId: vendorStore.id }
    if (isActive !== null) {
      where.isActive = isActive === "true"
    }

    // Fetch coupons
    const [coupons, total] = await Promise.all([
      prisma.coupons.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.coupons.count({ where }),
    ])

    // Return response
    return NextResponse.json({
      coupons,
      ...buildPaginatedResponse(coupons, total, page, limit).pagination,
    })
  } catch (error) {
    return handleApiError(error, 'Fetch coupons')
  }
}

// POST /api/vendor/coupons - Create new coupon
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createCouponSchema.parse(body)

    // Business logic validation
    if (validatedData.discountType === "PERCENTAGE") {
      if (validatedData.discountValue > 100) {
        throw new BusinessLogicError("Percentage discount cannot exceed 100%")
      }
    }

    // Validate date range
    if (validatedData.startDate && validatedData.endDate) {
      const start = new Date(validatedData.startDate)
      const end = new Date(validatedData.endDate)
      if (end <= start) {
        throw new BusinessLogicError("End date must be after start date")
      }
    }

    // Check if coupon code already exists for this store
    const existingCoupon = await prisma.coupons.findUnique({
      where: {
        vendorStoreId_code: {
          vendorStoreId: vendorStore.id,
          code: validatedData.code,
        },
      },
    })

    if (existingCoupon) {
      throw new BusinessLogicError("Coupon code already exists for your store")
    }

    // Create coupon
    const coupon = await prisma.coupons.create({
      data: {
        vendorStoreId: vendorStore.id,
        code: validatedData.code,
        description: validatedData.description,
        discountType: validatedData.discountType,
        discountValue: validatedData.discountValue,
        minPurchaseAmount: validatedData.minPurchaseAmount,
        maxDiscountAmount: validatedData.maxDiscountAmount,
        usageLimit: validatedData.usageLimit,
        perCustomerLimit: validatedData.perCustomerLimit,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        isActive: validatedData.isActive,
        applicableProducts: validatedData.applicableProducts,
        applicableCategories: validatedData.applicableCategories,
        excludedProducts: validatedData.excludedProducts,
        firstTimeCustomersOnly: validatedData.firstTimeCustomersOnly,
      },
    })

    // Return success response
    return successResponse({ coupon }, 201)
  } catch (error) {
    return handleApiError(error, 'Create coupon')
  }
}
