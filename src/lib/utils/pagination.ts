/**
 * Pagination Utilities
 * Reusable utilities for handling pagination across the application
 */

/**
 * Pagination parameters for queries
 */
export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Pagination metadata for responses
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 10
export const MAX_LIMIT = 100
export const MIN_LIMIT = 1

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)
  const hasNextPage = page < totalPages
  const hasPreviousPage = page > 1

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  }
}

/**
 * Calculate offset from page and limit
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit
}

/**
 * Validate and normalize pagination parameters
 */
export function normalizePaginationParams(
  params: Partial<PaginationParams>
): PaginationParams {
  const page = Math.max(params.page || DEFAULT_PAGE, 1)
  const limit = Math.min(
    Math.max(params.limit || DEFAULT_LIMIT, MIN_LIMIT),
    MAX_LIMIT
  )

  return {
    page,
    limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder || 'asc',
  }
}

/**
 * Create paginated result from data and total count
 */
export function createPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  return {
    data,
    meta: calculatePaginationMeta(total, params.page, params.limit),
  }
}

/**
 * Extract pagination params from query string or object
 */
export function extractPaginationParams(
  query: Record<string, string | number | undefined>
): PaginationParams {
  return normalizePaginationParams({
    page: typeof query.page === 'string' ? parseInt(query.page, 10) : (query.page as number),
    limit: typeof query.limit === 'string' ? parseInt(query.limit, 10) : (query.limit as number),
    sortBy: query.sortBy as string,
    sortOrder: query.sortOrder as 'asc' | 'desc',
  })
}

/**
 * Check if pagination params are valid
 */
export function isValidPaginationParams(params: unknown): params is PaginationParams {
  if (typeof params !== 'object' || params === null) return false

  const p = params as Record<string, unknown>

  return (
    typeof p.page === 'number' &&
    p.page >= 1 &&
    typeof p.limit === 'number' &&
    p.limit >= MIN_LIMIT &&
    p.limit <= MAX_LIMIT &&
    (!p.sortOrder || p.sortOrder === 'asc' || p.sortOrder === 'desc')
  )
}

/**
 * SQL LIMIT/OFFSET builder
 */
export function buildLimitOffset(params: PaginationParams): {
  limit: number
  offset: number
} {
  return {
    limit: params.limit,
    offset: calculateOffset(params.page, params.limit),
  }
}

/**
 * Create empty paginated result
 */
export function createEmptyPaginatedResult<T>(): PaginatedResult<T> {
  return {
    data: [],
    meta: {
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  }
}

/**
 * Cursor-based pagination parameters (for infinite scroll)
 */
export interface CursorPaginationParams {
  limit: number
  cursor?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Cursor-based pagination result
 */
export interface CursorPaginatedResult<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
}

/**
 * Create cursor paginated result
 */
export function createCursorPaginatedResult<T extends { id: string }>(
  data: T[],
  limit: number
): CursorPaginatedResult<T> {
  const hasMore = data.length > limit
  const resultData = hasMore ? data.slice(0, limit) : data
  const nextCursor = hasMore && resultData.length > 0
    ? resultData[resultData.length - 1].id
    : null

  return {
    data: resultData,
    nextCursor,
    hasMore,
  }
}
