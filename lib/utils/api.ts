/**
 * API Utilities - Standardized Response Helpers
 * 
 * Provides consistent API response patterns across all routes
 * Eliminates duplication of NextResponse.json calls (found in 67 files)
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { logger } from '@/lib/logger'

// Standard API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: any
  meta?: {
    timestamp: string
    requestId?: string
  }
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Success Responses
export function success<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString()
    }
  } as ApiResponse<T>, { status })
}

export function created<T>(data: T): NextResponse {
  return success(data, 201)
}

export function paginatedSuccess<T>(
  data: T[],
  pagination: PaginatedResponse<T>['pagination']
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination,
    meta: {
      timestamp: new Date().toISOString()
    }
  } as PaginatedResponse<T>)
}

// Error Responses
export function unauthorized(message = "Unauthorized"): NextResponse {
  return NextResponse.json({
    success: false,
    error: message,
    meta: {
      timestamp: new Date().toISOString()
    }
  } as ApiResponse, { status: 401 })
}

export function forbidden(message = "Forbidden"): NextResponse {
  return NextResponse.json({
    success: false,
    error: message,
    meta: {
      timestamp: new Date().toISOString()
    }
  } as ApiResponse, { status: 403 })
}

export function notFound(resource = "Resource"): NextResponse {
  return NextResponse.json({
    success: false,
    error: `${resource} not found`,
    meta: {
      timestamp: new Date().toISOString()
    }
  } as ApiResponse, { status: 404 })
}

export function badRequest(message = "Bad request", details?: any): NextResponse {
  return NextResponse.json({
    success: false,
    error: message,
    details,
    meta: {
      timestamp: new Date().toISOString()
    }
  } as ApiResponse, { status: 400 })
}

export function validationError(error: ZodError): NextResponse {
  return NextResponse.json({
    success: false,
    error: "Validation failed",
    details: error.errors,
    meta: {
      timestamp: new Date().toISOString()
    }
  } as ApiResponse, { status: 400 })
}

export function conflict(message = "Conflict"): NextResponse {
  return NextResponse.json({
    success: false,
    error: message,
    meta: {
      timestamp: new Date().toISOString()
    }
  } as ApiResponse, { status: 409 })
}

export function tooManyRequests(message = "Too many requests"): NextResponse {
  return NextResponse.json({
    success: false,
    error: message,
    meta: {
      timestamp: new Date().toISOString()
    }
  } as ApiResponse, { status: 429 })
}

export function internalServerError(message = "Internal server error", requestId?: string): NextResponse {
  // Log the error for monitoring
  logger.error("API Error", { message, requestId })
  
  return NextResponse.json({
    success: false,
    error: message,
    meta: {
      timestamp: new Date().toISOString(),
      requestId
    }
  } as ApiResponse, { status: 500 })
}

// Quota/Billing specific errors (common in this e-commerce platform)
export function quotaExceeded(
  resource: string,
  currentUsage: number,
  limit: number,
  upgradeUrl?: string
): NextResponse {
  return NextResponse.json({
    success: false,
    error: `${resource} limit reached (${limit}). Please upgrade your plan.`,
    details: {
      currentUsage,
      limit,
      upgradeUrl: upgradeUrl || "/tenant-dashboard/billing"
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  } as ApiResponse, { status: 403 })
}

export function storageExceeded(
  currentUsageGB: number,
  limitGB: number,
  additionalNeededGB: number,
  upgradeUrl?: string
): NextResponse {
  return NextResponse.json({
    success: false,
    error: `Storage limit exceeded. You're using ${currentUsageGB}GB of ${limitGB}GB. This operation would add ${additionalNeededGB.toFixed(2)}GB.`,
    details: {
      currentUsage: currentUsageGB,
      limit: limitGB,
      additionalNeeded: additionalNeededGB,
      upgradeUrl: upgradeUrl || "/tenant-dashboard/billing"
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  } as ApiResponse, { status: 403 })
}

// Error Handler Wrapper
export function handleApiError(error: unknown, requestId?: string): NextResponse {
  if (error instanceof ZodError) {
    return validationError(error)
  }
  
  if (error instanceof Error) {
    logger.error("API Error", { 
      message: error.message, 
      stack: error.stack, 
      requestId 
    })
    return internalServerError(error.message, requestId)
  }
  
  logger.error("Unknown API Error", { error, requestId })
  return internalServerError("An unexpected error occurred", requestId)
}

// Common Store Access Responses
export function storeNotFound(): NextResponse {
  return notFound("Store")
}

export function productNotFound(): NextResponse {
  return notFound("Product")
}

export function orderNotFound(): NextResponse {
  return notFound("Order")
}

export function userNotFound(): NextResponse {
  return notFound("User")
}