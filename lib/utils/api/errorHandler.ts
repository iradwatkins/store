/**
 * API Error Handler
 *
 * Centralized error handling for API routes
 * Converts custom errors to appropriate HTTP responses
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  BusinessLogicError,
  RateLimitError,
  ConflictError,
} from '@/lib/errors'
import { logger } from '@/lib/logger'

/**
 * Handle API errors and convert to appropriate HTTP responses
 *
 * @param error - The error to handle
 * @param operation - Description of the operation that failed (for logging)
 * @returns NextResponse with appropriate status code and error message
 *
 * @example
 * export async function POST(req: NextRequest) {
 *   try {
 *     const session = await requireAuth()
 *     // ... operation
 *     return NextResponse.json({ success: true })
 *   } catch (error) {
 *     return handleApiError(error, 'Create product')
 *   }
 * }
 */
export function handleApiError(
  error: unknown,
  operation: string
): NextResponse {
  // Zod validation errors
  if (error instanceof z.ZodError) {
    logger.warn(`Validation error in ${operation}`, { issues: error.issues })
    return NextResponse.json(
      {
        error: 'Invalid request data',
        details: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 }
    )
  }

  // Authentication error
  if (error instanceof AuthError) {
    logger.warn(`Auth error in ${operation}:`, error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    )
  }

  // Authorization error
  if (error instanceof ForbiddenError) {
    logger.warn(`Forbidden error in ${operation}:`, error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 403 }
    )
  }

  // Not found error
  if (error instanceof NotFoundError) {
    logger.info(`Not found error in ${operation}:`, error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 404 }
    )
  }

  // Validation error
  if (error instanceof ValidationError) {
    logger.warn(`Validation error in ${operation}:`, error.message, { details: error.details })
    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
      },
      { status: 400 }
    )
  }

  // Business logic error
  if (error instanceof BusinessLogicError) {
    logger.warn(`Business logic error in ${operation}:`, error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  // Rate limit error
  if (error instanceof RateLimitError) {
    logger.warn(`Rate limit exceeded in ${operation}:`, error.message)
    return NextResponse.json(
      { error: error.message },
      {
        status: 429,
        headers: {
          'Retry-After': '60', // 60 seconds
        },
      }
    )
  }

  // Conflict error
  if (error instanceof ConflictError) {
    logger.warn(`Conflict error in ${operation}:`, error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 409 }
    )
  }

  // Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any

    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      const field = prismaError.meta?.target?.[0] || 'field'
      logger.warn(`Unique constraint violation in ${operation}`, { field })
      return NextResponse.json(
        { error: `A record with this ${field} already exists` },
        { status: 409 }
      )
    }

    // Foreign key constraint failed
    if (prismaError.code === 'P2003') {
      logger.warn(`Foreign key constraint failed in ${operation}`)
      return NextResponse.json(
        { error: 'Referenced record does not exist' },
        { status: 400 }
      )
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      logger.info(`Record not found in ${operation}`)
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      )
    }
  }

  // Generic error (unexpected)
  logger.error(`Unexpected error in ${operation}:`, error)

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development'
  const errorMessage = isDevelopment && error instanceof Error
    ? error.message
    : 'An unexpected error occurred'

  return NextResponse.json(
    {
      error: errorMessage,
      ...(isDevelopment && error instanceof Error && {
        stack: error.stack,
      }),
    },
    { status: 500 }
  )
}

/**
 * Create a success response with consistent format
 *
 * @param data - Data to return
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with success: true and data
 *
 * @example
 * return successResponse({ product }, 201)
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status }
  )
}

/**
 * Create an error response manually (when not using handleApiError)
 *
 * @param message - Error message
 * @param status - HTTP status code
 * @param details - Optional additional details
 * @returns NextResponse with error message
 */
export function errorResponse(
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status }
  )
}
