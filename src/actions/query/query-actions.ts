'use server'

/**
 * Server Actions for SQL Query Execution
 * Provides secure SQL query execution with permissions and validation
 */

import { sql } from 'drizzle-orm'
import { getProjectDb } from '@/lib/db/connections'
import { requireAuth } from '@/lib/auth/middleware'
import { requireProjectPermission } from '@/lib/auth/permissions'
import { errorHandler, ValidationError } from '@/lib/utils/error-handler'
import { serverActionSuccess, serverActionError, type ServerActionResponse } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'

export type QueryResult = {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  executionTime: number
  query: string
}

export type SavedQuery = {
  id: string
  name: string
  query: string
  description?: string
  createdAt: Date
}

/**
 * Check if query is read-only (SELECT only)
 */
function isReadOnlyQuery(query: string): boolean {
  const trimmed = query.trim().toLowerCase()

  // Allow SELECT, SHOW, EXPLAIN, DESCRIBE
  const readOnlyPatterns = [/^select\s/i, /^show\s/i, /^explain\s/i, /^describe\s/i, /^desc\s/i]

  return readOnlyPatterns.some((pattern) => pattern.test(trimmed))
}

/**
 * Check if query contains dangerous operations
 */
function isDangerousQuery(query: string): boolean {
  const dangerous = [
    /drop\s+(table|database|schema|index)/i,
    /truncate\s+table/i,
    /alter\s+(table|database)/i,
    /create\s+(table|database|schema)/i,
    /grant\s/i,
    /revoke\s/i,
  ]

  return dangerous.some((pattern) => pattern.test(query))
}

/**
 * Execute SQL query with security checks
 */
export async function executeQueryAction(
  projectId: string,
  query: string
): Promise<ServerActionResponse<QueryResult>> {
  try {
    const session = await requireAuth()

    // Validate query is not empty
    if (!query || query.trim().length === 0) {
      throw new ValidationError('Query cannot be empty')
    }

    const isReadOnly = isReadOnlyQuery(query)

    // Check permissions based on query type
    if (isReadOnly) {
      await requireProjectPermission(session.user.id, projectId, 'data.read')
    } else {
      // For mutations, require special permission
      await requireProjectPermission(session.user.id, projectId, 'data.update')

      // Additional safety check for dangerous operations
      if (isDangerousQuery(query)) {
        throw new ValidationError(
          'Dangerous operations (DROP, TRUNCATE, ALTER) are not allowed through the query interface'
        )
      }
    }

    const result = await errorHandler(async () => {
      const db = await getProjectDb(projectId)

      const startTime = performance.now()
      const queryResult = await db.execute<Record<string, unknown>>(sql.raw(query))
      const endTime = performance.now()

      const executionTime = Math.round(endTime - startTime)

      // Extract column names from first row
      const columns = queryResult.length > 0 ? Object.keys(queryResult[0]) : []

      logger.info('Query executed', {
        projectId,
        userId: session.user.id,
        queryType: isReadOnly ? 'SELECT' : 'MUTATION',
        rowCount: queryResult.length,
        executionTime,
        queryPreview: query.substring(0, 100),
      })

      return {
        columns,
        rows: queryResult,
        rowCount: queryResult.length,
        executionTime,
        query,
      }
    }, 'executeQuery')

    return serverActionSuccess(result)
  } catch (error) {
    // @ts-expect-error - TODO: Fix ServerActionResponse generic type inference
    return serverActionError(error)
  }
}

/**
 * Get query history for a project (stored in localStorage on client)
 * This is a placeholder - actual implementation will use client-side storage
 */
export async function getQueryHistoryAction(
  projectId: string
): Promise<ServerActionResponse<QueryResult[]>> {
  try {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    // History is stored client-side for now
    // Future: Could store in database with user_id + project_id
    return serverActionSuccess([])
  } catch (error) {
    // @ts-expect-error - TODO: Fix ServerActionResponse generic type inference
    return serverActionError(error)
  }
}

/**
 * Save a query for later use
 * Future enhancement: Store in database
 */
export async function saveQueryAction(
  projectId: string,
  name: string,
  query: string,
  description?: string
): Promise<ServerActionResponse<SavedQuery>> {
  try {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    if (!name || name.trim().length === 0) {
      throw new ValidationError('Query name is required')
    }

    if (!query || query.trim().length === 0) {
      throw new ValidationError('Query cannot be empty')
    }

    // For now, return a mock saved query
    // Future: Store in database table
    const savedQuery: SavedQuery = {
      id: crypto.randomUUID(),
      name: name.trim(),
      query: query.trim(),
      description: description?.trim(),
      createdAt: new Date(),
    }

    logger.info('Query saved', {
      projectId,
      userId: session.user.id,
      queryName: name,
    })

    return serverActionSuccess(savedQuery)
  } catch (error) {
    // @ts-expect-error - TODO: Fix ServerActionResponse generic type inference
    return serverActionError(error)
  }
}
