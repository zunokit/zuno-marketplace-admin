/**
 * API Response Utilities
 * Standardized response format for all API endpoints
 * Follows Rails API style conventions using generic functions
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
 * Generic API response function
 */
export function apiResponse<T>(
  data: T | { message: string; errors?: Array<{ message: string; field?: string }> },
  options: {
    status: number;
    isSuccessful?: boolean;
    message?: string;
  }
) {
  if (options.isSuccessful) {
    // Success response
    const successResponse: ApiSuccessResponse<T> = { data: data as T };
    if (options.message) successResponse.message = options.message;
    return NextResponse.json(successResponse, { status: options.status });
  } else {
    // Error response
    const errorData = data as { message: string; errors?: Array<{ message: string; field?: string }> };
    const errorResponse: ApiErrorResponse = {
      message: errorData.message,
      errors: errorData.errors || [{ message: errorData.message }],
    };
    return NextResponse.json(errorResponse, { status: options.status });
  }
}

/**
 * Success response (200)
 */
export function successResponse<T>(data: T, message?: string) {
  return apiResponse<T>(data, { status: 200, isSuccessful: true, message });
}

/**
 * Created response (201)
 */
export function createdResponse<T>(data: T, message?: string) {
  return apiResponse<T>(data, { status: 201, isSuccessful: true, message });
}

/**
 * Bad request response (400)
 */
export function badRequestResponse(message: string, errors?: Array<{ message: string; field?: string }>) {
  return apiResponse({ message, errors }, { status: 400, isSuccessful: false });
}

/**
 * Unauthorized response (401)
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return apiResponse({ message, errors: [{ message }] }, { status: 401, isSuccessful: false });
}

/**
 * Forbidden response (403)
 */
export function forbiddenResponse(message: string = 'Forbidden') {
  return apiResponse({ message, errors: [{ message }] }, { status: 403, isSuccessful: false });
}

/**
 * Not found response (404)
 */
export function notFoundResponse(message: string = 'Resource not found') {
  return apiResponse({ message, errors: [{ message }] }, { status: 404, isSuccessful: false });
}

/**
 * Internal server error response (500)
 */
export function errorResponse(error: unknown) {
  const sanitized = sanitizeError(error);
  return apiResponse(
    { message: sanitized.message, errors: [{ message: sanitized.message }] }, 
    { status: sanitized.statusCode, isSuccessful: false }
  );
}

/**
 * Server Action response type
 */
export type ServerActionResponse<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; errors?: Array<{ message: string; field?: string }> }

/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse<T>(
  response: ServerActionResponse<T>
): response is { success: true; data: T; message?: string } {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse<T>(
  response: ServerActionResponse<T>
): response is { success: false; error: string } {
  return response.success === false;
}

/**
 * Generic server action response function
 */
function serverActionResponse<T>(
  data: T | string,
  options: {
    success: boolean;
    error?: string;
    errors?: Array<{ message: string; field?: string }>;
    message?: string;
  }
): ServerActionResponse<T> {
  if (options.success) {
    return { success: true, data: data as T, message: options.message };
  } else {
    return {
      success: false,
      error: options.error || (data as string),
      errors: options.errors,
    };
  }
}

/**
 * Success response for Server Actions
 */
export function serverActionSuccess<T>(data: T, message?: string): ServerActionResponse<T> {
  return serverActionResponse<T>(data, { success: true, message });
}

/**
 * Error response for Server Actions
 */
export function serverActionError<T = never>(
  error: unknown,
  errors?: Array<{ message: string; field?: string }>
): ServerActionResponse<T> {
  const sanitized = sanitizeError(error);
  return serverActionResponse<T>(sanitized.message, { success: false, error: sanitized.message, errors });
}
