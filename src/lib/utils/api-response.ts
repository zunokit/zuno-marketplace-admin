/**
 * API Response Utilities
 * Standardized response format for all API endpoints
 * Follows Rails API style conventions
 */

import { NextResponse } from 'next/server'
import { sanitizeError } from './error-handler'

interface ApiSuccessResponse<T = unknown> {
  data: T
  message?: string
}

interface ApiErrorResponse {
  errors: Array<{
    message: string
    field?: string
    code?: string
  }>
  message: string
}

/**
 * Success response (200)
 */
export function successResponse<T>(data: T, message?: string) {
  const response: ApiSuccessResponse<T> = { data }
  if (message) response.message = message

  return NextResponse.json(response, { status: 200 })
}

/**
 * Created response (201)
 */
export function createdResponse<T>(data: T, message?: string) {
  const response: ApiSuccessResponse<T> = { data }
  if (message) response.message = message

  return NextResponse.json(response, { status: 201 })
}

/**
 * Bad request response (400)
 */
export function badRequestResponse(message: string, errors?: Array<{ message: string; field?: string }>) {
  const response: ApiErrorResponse = {
    message,
    errors: errors || [{ message }],
  }

  return NextResponse.json(response, { status: 400 })
}

/**
 * Unauthorized response (401)
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  const response: ApiErrorResponse = {
    message,
    errors: [{ message }],
  }

  return NextResponse.json(response, { status: 401 })
}

/**
 * Forbidden response (403)
 */
export function forbiddenResponse(message: string = 'Forbidden') {
  const response: ApiErrorResponse = {
    message,
    errors: [{ message }],
  }

  return NextResponse.json(response, { status: 403 })
}

/**
 * Not found response (404)
 */
export function notFoundResponse(message: string = 'Resource not found') {
  const response: ApiErrorResponse = {
    message,
    errors: [{ message }],
  }

  return NextResponse.json(response, { status: 404 })
}

/**
 * Internal server error response (500)
 */
export function errorResponse(error: unknown) {
  const sanitized = sanitizeError(error)
  const response: ApiErrorResponse = {
    message: sanitized.message,
    errors: [{ message: sanitized.message }],
  }

  return NextResponse.json(response, { status: sanitized.statusCode })
}

/**
 * Server Action response type
 */
export type ServerActionResponse<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; errors?: Array<{ message: string; field?: string }> }

/**
 * Success response for Server Actions
 */
export function serverActionSuccess<T>(data: T, message?: string): ServerActionResponse<T> {
  return { success: true, data, message }
}

/**
 * Error response for Server Actions
 */
export function serverActionError(
  error: unknown,
  errors?: Array<{ message: string; field?: string }>
): ServerActionResponse {
  const sanitized = sanitizeError(error)
  return {
    success: false,
    error: sanitized.message,
    errors,
  }
}
