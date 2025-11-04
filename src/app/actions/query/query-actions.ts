'use server'

/**
 * Server Actions for SQL Query Execution
 * Clean architecture implementation using use cases and repositories
 */

import { requireAuth } from '@/lib/auth/middleware'
import { requireProjectPermission } from '@/lib/auth/permissions'
import type { ServerActionResponse } from '@/lib/utils/api-response'
import { withServerAction } from '@/lib/utils/try-catch'
import { container } from '@/lib/core/di-container'
import type { QueryResult, SavedQuery } from '@/lib/core/domain/entities/query.entity'

// Re-export types for compatibility with existing components
export type { QueryResult, SavedQuery } from '@/lib/core/domain/entities/query.entity'

/**
 * Execute SQL query with security checks
 */
export async function executeQueryAction(
  projectId: string,
  query: string
): Promise<ServerActionResponse<QueryResult>> {
  return withServerAction(async () => {
    const session = await requireAuth()

    // Check if user has data.read permission (minimum for queries)
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    // Check if user has data.update permission for mutations (don't throw)
    const hasUpdatePermission = await (async () => {
      try {
        await requireProjectPermission(session.user.id, projectId, 'data.update')
        return true
      } catch {
        return false
      }
    })()

    // Execute query through use case
    const useCase = container.executeQueryUseCase()
    const result = await useCase.execute({
      projectId,
      query,
      userId: session.user.id,
      hasUpdatePermission,
    })

    return result
  }, 'executeQueryAction')
}

/**
 * Get query history for a project (stored in localStorage on client)
 * This is a placeholder - actual implementation will use client-side storage
 */
export async function getQueryHistoryAction(
  projectId: string
): Promise<ServerActionResponse<QueryResult[]>> {
  return withServerAction(async () => {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    // History is stored client-side for now
    // Future: Could store in database with user_id + project_id
    return []
  }, 'getQueryHistoryAction')
}

/**
 * Save a query for later use
 */
export async function saveQueryAction(
  projectId: string,
  name: string,
  query: string,
  description?: string
): Promise<ServerActionResponse<SavedQuery>> {
  return withServerAction(async () => {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    // Save query through use case
    const useCase = container.saveQueryUseCase()
    const savedQuery = await useCase.execute({
      projectId,
      userId: session.user.id,
      name,
      query,
      description,
    })

    return savedQuery
  }, 'saveQueryAction')
}
