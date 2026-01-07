/**
 * Utils Index
 * Central export file for all utility functions
 *
 * @module utils
 * @description Organized exports of all utility modules for easy importing.
 * Use this index to import utilities throughout the application.
 *
 * @example
 * ```typescript
 * // Instead of multiple imports
 * import { AppError } from '@/lib/utils/error-handler'
 * import { withErrorHandling } from '@/lib/utils/try-catch'
 * import { successResponse } from '@/lib/utils/api-response'
 *
 * // Use single import
 * import { AppError, withErrorHandling, successResponse } from '@/lib/utils'
 * ```
 */

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Error classes and sanitization
 * Custom error types and error sanitization for client responses
 */
export {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  sanitizeError,
} from './error-handler'

/**
 * Generic error handling wrappers
 * Type-safe error handling utilities with discriminated unions
 */
export {
  withErrorHandling,
  withServerAction,
  safeTry,
  tryValidate,
  safeTransform,
  runSafely,
  type TryResult,
} from './try-catch'

// ============================================================================
// API & Server Action Responses
// ============================================================================

/**
 * API route responses (NextResponse)
 * Standardized response formats for Next.js API routes
 */
export {
  successResponse,
  createdResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  errorResponse,
} from './api-response'

/**
 * Server Action responses
 * Type-safe response formats for Next.js Server Actions
 */
export {
  serverActionSuccess,
  serverActionError,
  isSuccessResponse,
  isErrorResponse,
  type ServerActionResponse,
} from './api-response'

// ============================================================================
// RBAC & Permissions
// ============================================================================

/**
 * Core permission functions
 * Project-level permission checking and role management
 */
export {
  checkProjectPermission,
  requireProjectPermission,
  getUserProjectRole,
  getUserProjects,
  checkAdminPermission,
  isSuperAdmin,
} from '../auth/permissions'

/**
 * Advanced RBAC utilities
 * Resource-based access control and permission utilities
 */
export {
  rbacService,
  canAccess,
  requireAccess,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  canAccessResourceById,
  withPermissionCheck,
  createResourceGuard,
  checkMultiplePermissions,
  PermissionUtils,
  type RBACContext,
} from './rbac'

// ============================================================================
// Data Utilities
// ============================================================================

/**
 * Pagination utilities
 * Functions for handling pagination, offset calculation, and metadata
 */
export {
  calculatePaginationMeta,
  calculateOffset,
  normalizePaginationParams,
  createPaginatedResult,
  extractPaginationParams,
  isValidPaginationParams,
  buildLimitOffset,
  createEmptyPaginatedResult,
  createCursorPaginatedResult,
  type PaginationParams,
  type PaginationMeta,
  type PaginatedResult,
  type CursorPaginationParams,
  type CursorPaginatedResult,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  MIN_LIMIT,
} from './pagination'

/**
 * Filtering utilities
 * Functions for building filters, search conditions, and query parameters
 */
export {
  isValidFilterOperator,
  isValidFilterCondition,
  sanitizeFieldName,
  buildWhereOperator,
  prepareFilterValue,
  createSearchConditions,
  combineFiltersAndSearch,
  validateFilterValue,
  extractFilterParams,
  type FilterOperator,
  type FilterCondition,
  type FilterGroup,
  type SearchParams,
  type FilterParams,
} from './filtering'

/**
 * Export utilities
 * Functions for exporting data to CSV and JSON formats
 */
export {
  convertToCSV,
  downloadCSV,
  downloadJSON,
} from './export'

// ============================================================================
// Security & Cryptography
// ============================================================================

/**
 * Invitation token utilities
 * Secure token generation and validation for invitations
 */
export {
  generateInvitationToken,
  hashInvitationToken,
  verifyInvitationToken,
  generateInvitationUrl,
  isInvitationExpired,
  calculateExpirationDate,
} from './invitation-token'

// ============================================================================
// Database & Validation
// ============================================================================

/**
 * Connection string utilities
 * PostgreSQL connection string validation and parsing
 */
export {
  normalizeConnectionString,
  isValidPostgresUrl,
  parsePostgresUrl,
  getConnectionStringError,
} from './normalize-connection-string'

// ============================================================================
// Environment & Logging
// ============================================================================

/**
 * Environment utilities
 * Functions for checking runtime environment
 */
export {
  isDevelopment,
  isProduction,
  isTest,
  isServer,
  isClient,
  getEnvironment,
  isDebugMode,
} from './environment'

/**
 * Logger
 * Centralized logging with different log levels
 */
export { logger } from './logger'
