import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"
import { logger } from "@/lib/logger"

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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const isActive = searchParams.get("isActive")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = { vendorStoreId: vendorStore.id }
    if (isActive !== null) {
      where.isActive = isActive === "true"
    }

    // Get coupons with pagination
    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.coupon.count({ where }),
    ])

    return NextResponse.json({
      coupons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error("Error fetching coupons:", error)
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    )
  }
}

// POST /api/vendor/coupons - Create new coupon
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createCouponSchema.parse(body)

    // Validate discount value based on type
    if (validatedData.discountType === "PERCENTAGE") {
      if (validatedData.discountValue > 100) {
        return NextResponse.json(
          { error: "Percentage discount cannot exceed 100%" },
          { status: 400 }
        )
      }
    }

    // Validate date range
    if (validatedData.startDate && validatedData.endDate) {
      const start = new Date(validatedData.startDate)
      const end = new Date(validatedData.endDate)
      if (end <= start) {
        return NextResponse.json(
          { error: "End date must be after start date" },
          { status: 400 }
        )
      }
    }

    // Check if coupon code already exists for this store
    const existingCoupon = await prisma.coupon.findUnique({
      where: {
        vendorStoreId_code: {
          vendorStoreId: vendorStore.id,
          code: validatedData.code,
        },
      },
    })

    if (existingCoupon) {
      return NextResponse.json(
        { error: "Coupon code already exists for your store" },
        { status: 400 }
      )
    }

    // Create coupon
    const coupon = await prisma.coupon.create({
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

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    logger.error("Error creating coupon:", error)
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    )
  }
}
