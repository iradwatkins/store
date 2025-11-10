/**
 * API Utilities - Central Export
 *
 * Import everything you need from '@/lib/utils/api'
 */

// Pagination
export {
  getPaginationParams,
  buildPaginatedResponse,
  buildCursorPaginationMeta,
  type PaginationParams,
  type PaginationMeta,
  type PaginatedResponse,
} from './pagination'

// Error Handling
export {
  handleApiError,
  successResponse,
  errorResponse,
} from './errorHandler'

// Auth Helpers
export {
  requireAuth,
  requireAdmin,
  requireVendorStore,
  requireProductOwnership,
} from './helpers'

// ID Generation
export {
  generateId,
  idGenerators,
  parseId,
} from './idGenerator'
