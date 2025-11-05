/**
 * API Response Utilities
 * Standardized response formats for API endpoints and Server Actions
 *
 * @module api-response
 * @description Provides type-safe, consistent response formats for:
 * - Next.js API Routes (NextResponse with JSON)
 * - Server Actions (discriminated union responses)
 * - HTTP status codes (200, 201, 400, 401, 403, 404, 500)
 *
 * Follows RESTful conventions with separate data/error structures.
 *
 * @example
 * ```typescript
 * // API Route
 * export async function GET(request: Request) {
 *   const users = await db.query.users.findMany()
 *   return successResponse(users)
 * }
 *
 * // Server Action
 * export async function createUser(data: CreateUserInput) {
 *   try {
 *     const user = await db.insert(users).values(data)
 *     return serverActionSuccess(user, 'User created successfully')
 *   } catch (error) {
 *     return serverActionError(error)
 *   }
 * }
 * ```
 */

import { NextResponse } from 'next/server'
import { sanitizeError } from './error-handler'

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Successful API response structure
 * Contains data and optional message
 */
interface ApiSuccessResponse<T = unknown> {
  data: T
  message?: string
}

/**
 * Error API response structure
 * Contains errors array and summary message
 */
interface ApiErrorResponse {
  message: string
  errors: Array<{
    message: string
    field?: string
    code?: string
  }>
}

// ============================================================================
// API Route Responses (NextResponse)
// ============================================================================

/**
 * Success response (200 OK)
 * Use for successful GET, PUT, PATCH requests
 *
 * @template T - Type of the response data
 * @param data - The data to return
 * @param message - Optional success message
 * @returns NextResponse with JSON data
 *
 * @example
 * ```typescript
 * export async function GET() {
 *   const users = await db.query.users.findMany()
 *   return successResponse(users)
 * }
 * ```
 */
export function successResponse<T>(data: T, message?: string): NextResponse {
  const response: ApiSuccessResponse<T> = { data }
  if (message) response.message = message

  return NextResponse.json(response, { status: 200 })
}

/**
 * Created response (201 Created)
 * Use for successful POST requests that create resources
 *
 * @template T - Type of the created resource
 * @param data - The created resource
 * @param message - Optional success message
 * @returns NextResponse with JSON data
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const body = await request.json()
 *   const user = await db.insert(users).values(body).returning()
 *   return createdResponse(user[0], 'User created successfully')
 * }
 * ```
 */
export function createdResponse<T>(data: T, message?: string): NextResponse {
  const response: ApiSuccessResponse<T> = { data }
  if (message) response.message = message

  return NextResponse.json(response, { status: 201 })
}

/**
 * Bad request response (400 Bad Request)
 * Use for validation errors or malformed requests
 *
 * @param message - Error message summary
 * @param errors - Optional detailed error array
 * @returns NextResponse with error details
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const validation = validateInput(await request.json())
 *   if (!validation.success) {
 *     return badRequestResponse('Validation failed', validation.errors)
 *   }
 * }
 * ```
 */
export function badRequestResponse(
  message: string,
  errors?: Array<{ message: string; field?: string; code?: string }>
): NextResponse {
  const response: ApiErrorResponse = {
    message,
    errors: errors || [{ message }],
  }

  return NextResponse.json(response, { status: 400 })
}

/**
 * Unauthorized response (401 Unauthorized)
 * Use when authentication is required but not provided/invalid
 *
 * @param message - Error message (default: 'Unauthorized')
 * @returns NextResponse with error details
 *
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const session = await auth()
 *   if (!session) {
 *     return unauthorizedResponse('Please sign in to continue')
 *   }
 * }
 * ```
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  const response: ApiErrorResponse = {
    message,
    errors: [{ message, code: 'UNAUTHORIZED' }],
  }

  return NextResponse.json(response, { status: 401 })
}

/**
 * Forbidden response (403 Forbidden)
 * Use when user is authenticated but lacks required permissions
 *
 * @param message - Error message (default: 'Forbidden')
 * @returns NextResponse with error details
 *
 * @example
 * ```typescript
 * export async function DELETE(request: Request) {
 *   const session = await auth()
 *   if (!session.user.isAdmin) {
 *     return forbiddenResponse('Admin access required')
 *   }
 * }
 * ```
 */
export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  const response: ApiErrorResponse = {
    message,
    errors: [{ message, code: 'FORBIDDEN' }],
  }

  return NextResponse.json(response, { status: 403 })
}

/**
 * Not found response (404 Not Found)
 * Use when requested resource doesn't exist
 *
 * @param message - Error message (default: 'Resource not found')
 * @returns NextResponse with error details
 *
 * @example
 * ```typescript
 * export async function GET(request: Request, { params }: { params: { id: string } }) {
 *   const user = await db.query.users.findFirst({ where: eq(users.id, params.id) })
 *   if (!user) {
 *     return notFoundResponse('User not found')
 *   }
 *   return successResponse(user)
 * }
 * ```
 */
export function notFoundResponse(message: string = 'Resource not found'): NextResponse {
  const response: ApiErrorResponse = {
    message,
    errors: [{ message, code: 'NOT_FOUND' }],
  }

  return NextResponse.json(response, { status: 404 })
}

/**
 * Error response (500 Internal Server Error)
 * Use for unexpected errors, automatically sanitizes error details
 *
 * @param error - The error object (will be sanitized)
 * @returns NextResponse with sanitized error details
 *
 * @example
 * ```typescript
 * export async function GET() {
 *   try {
 *     const data = await fetchData()
 *     return successResponse(data)
 *   } catch (error) {
 *     return errorResponse(error)
 *   }
 * }
 * ```
 */
export function errorResponse(error: unknown): NextResponse {
  const sanitized = sanitizeError(error)
  const response: ApiErrorResponse = {
    message: sanitized.message,
    errors: [{ message: sanitized.message, code: 'INTERNAL_ERROR' }],
  }

  return NextResponse.json(response, { status: sanitized.statusCode })
}

// ============================================================================
// Server Action Response Types
// ============================================================================

/**
 * Server Action response type (discriminated union)
 * Use this for Next.js Server Actions to enable type-safe error handling
 *
 * @template T - Type of the success data
 *
 * @example
 * ```typescript
 * async function createUser(data: CreateUserInput): Promise<ServerActionResponse<User>> {
 *   try {
 *     const user = await db.insert(users).values(data).returning()
 *     return serverActionSuccess(user[0])
 *   } catch (error) {
 *     return serverActionError(error)
 *   }
 * }
 *
 * // In component
 * const result = await createUser(formData)
 * if (result.success) {
 *   toast.success(result.message || 'Success')
 *   router.push(`/users/${result.data.id}`)
 * } else {
 *   toast.error(result.error)
 * }
 * ```
 */
export type ServerActionResponse<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; errors?: Array<{ message: string; field?: string }> }

/**
 * Type guard to check if response is successful
 * Narrows the type to success variant
 *
 * @param response - The server action response
 * @returns true if response is successful
 *
 * @example
 * ```typescript
 * const result = await someAction()
 * if (isSuccessResponse(result)) {
 *   // TypeScript knows result.data exists here
 *   console.log(result.data)
 * }
 * ```
 */
export function isSuccessResponse<T>(
  response: ServerActionResponse<T>
): response is { success: true; data: T; message?: string } {
  return response.success === true
}

/**
 * Type guard to check if response is an error
 * Narrows the type to error variant
 *
 * @param response - The server action response
 * @returns true if response is an error
 *
 * @example
 * ```typescript
 * const result = await someAction()
 * if (isErrorResponse(result)) {
 *   // TypeScript knows result.error exists here
 *   console.error(result.error)
 * }
 * ```
 */
export function isErrorResponse<T>(
  response: ServerActionResponse<T>
): response is { success: false; error: string } {
  return response.success === false
}

// ============================================================================
// Server Action Response Builders
// ============================================================================

/**
 * Success response for Server Actions
 * Returns discriminated union with success: true
 *
 * @template T - Type of the success data
 * @param data - The data to return
 * @param message - Optional success message
 * @returns Server action success response
 *
 * @example
 * ```typescript
 * export async function createUserAction(data: CreateUserInput) {
 *   const user = await db.insert(users).values(data).returning()
 *   return serverActionSuccess(user[0], 'User created successfully')
 * }
 * ```
 */
export function serverActionSuccess<T>(data: T, message?: string): ServerActionResponse<T> {
  return { success: true, data, message }
}

/**
 * Error response for Server Actions
 * Automatically sanitizes error and returns discriminated union with success: false
 *
 * @template T - Type parameter (usually not needed for errors)
 * @param error - The error object (will be sanitized)
 * @param errors - Optional detailed validation errors
 * @returns Server action error response
 *
 * @example
 * ```typescript
 * export async function deleteUserAction(userId: string) {
 *   try {
 *     await db.delete(users).where(eq(users.id, userId))
 *     return serverActionSuccess(null, 'User deleted')
 *   } catch (error) {
 *     return serverActionError(error)
 *   }
 * }
 * ```
 */
export function serverActionError<T = never>(
  error: unknown,
  errors?: Array<{ message: string; field?: string }>
): ServerActionResponse<T> {
  const sanitized = sanitizeError(error)

  return {
    success: false,
    error: sanitized.message,
    errors,
  }
}
