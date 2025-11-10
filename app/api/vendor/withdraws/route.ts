import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"
import {
  requireAuth,
  getPaginationParams,
  buildPaginatedResponse,
  handleApiError,
  successResponse,
  idGenerators,
} from "@/lib/utils/api"
import { BusinessLogicError } from "@/lib/errors"

// Validation schema
const createWithdrawSchema = z.object({
  amount: z.number().min(1, "Amount must be at least $1"),
  method: z.enum(["BANK_TRANSFER", "PAYPAL", "STRIPE", "SKRILL"]),
  notes: z.string().optional(),
  bankDetails: z.record(z.any()).optional(),
})

// GET /api/vendor/withdraws - List vendor's withdraw requests
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await requireAuth()
    const vendorStore = await prisma.vendor_stores.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        withdrawBalance: true,
        minimumWithdraw: true,
        withdrawMethod: true
      },
    })

    if (!vendorStore) {
      throw new BusinessLogicError("Vendor store not found")
    }

    // Pagination
    const { page, limit, skip } = getPaginationParams(request.nextUrl.searchParams)
    const status = request.nextUrl.searchParams.get("status") || "all"

    // Build where clause
    const where: any = { vendorStoreId: vendorStore.id }
    if (status !== "all") {
      where.status = status
    }

    // Fetch withdraws
    const [withdraws, total] = await Promise.all([
      prisma.vendor_withdraws.findMany({
        where,
        orderBy: { requestedAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.vendor_withdraws.count({ where }),
    ])

    return NextResponse.json({
      withdraws: withdraws.map((w) => ({
        id: w.id,
        amount: Number(w.amount),
        method: w.method,
        status: w.status,
        requestedAt: w.requestedAt.toISOString(),
        processedAt: w.processedAt?.toISOString() || null,
        notes: w.notes,
        adminNotes: w.adminNotes,
      })),
      balance: Number(vendorStore.withdrawBalance),
      minimumWithdraw: Number(vendorStore.minimumWithdraw),
      ...buildPaginatedResponse(withdraws, total, page, limit).pagination,
    })
  } catch (error) {
    return handleApiError(error, 'Fetch withdraws')
  }
}

// POST /api/vendor/withdraws - Create withdraw request
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await requireAuth()
    const vendorStore = await prisma.vendor_stores.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        withdrawBalance: true,
        minimumWithdraw: true,
        withdrawMethod: true,
        stripeAccountId: true,
        paypalEmail: true,
      },
    })

    if (!vendorStore) {
      throw new BusinessLogicError("Vendor store not found")
    }

    // Parse and validate request
    const body = await request.json()
    const validatedData = createWithdrawSchema.parse(body)

    // Business logic validation
    if (validatedData.amount < Number(vendorStore.minimumWithdraw)) {
      throw new BusinessLogicError(`Minimum withdraw amount is $${vendorStore.minimumWithdraw}`)
    }

    if (validatedData.amount > Number(vendorStore.withdrawBalance)) {
      throw new BusinessLogicError(`Insufficient balance. Available: $${vendorStore.withdrawBalance}`)
    }

    if (validatedData.method === "STRIPE" && !vendorStore.stripeAccountId) {
      throw new BusinessLogicError("Stripe account not connected")
    }

    if (validatedData.method === "PAYPAL" && !vendorStore.paypalEmail) {
      throw new BusinessLogicError("PayPal email not configured")
    }

    // Use transaction to ensure atomicity and prevent race conditions
    const withdraw = await prisma.$transaction(async (tx) => {
      // Check for pending withdraws within transaction
      const pendingWithdraw = await tx.vendor_withdraws.findFirst({
        where: {
          vendorStoreId: vendorStore.id,
          status: { in: ["PENDING", "APPROVED", "PROCESSING"] },
        },
      })

      if (pendingWithdraw) {
        throw new BusinessLogicError("You have a pending withdraw request. Please wait for it to be processed.")
      }

      // Create withdraw request with generated ID
      const newWithdraw = await tx.vendor_withdraws.create({
        data: {
          id: idGenerators.withdraw(),
          vendorStoreId: vendorStore.id,
          amount: validatedData.amount,
          method: validatedData.method,
          status: "PENDING",
          notes: validatedData.notes,
          bankDetails: validatedData.bankDetails,
        },
      })

      // Deduct from available balance
      await tx.vendor_stores.update({
        where: { id: vendorStore.id },
        data: {
          withdrawBalance: {
            decrement: validatedData.amount,
          },
        },
      })

      return newWithdraw
    })

    logger.info(`Withdraw request created: ${withdraw.id} for $${validatedData.amount}`)

    return successResponse(
      {
        message: "Withdraw request submitted successfully",
        withdraw: {
          id: withdraw.id,
          amount: Number(withdraw.amount),
          method: withdraw.method,
          status: withdraw.status,
          requestedAt: withdraw.requestedAt.toISOString(),
        },
      },
      201
    )
  } catch (error) {
    return handleApiError(error, 'Create withdraw')
  }
}
