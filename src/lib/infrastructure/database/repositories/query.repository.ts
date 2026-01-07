/**
 * Query Repository Implementation
 * Handles query execution and saved query management
 */

import { sql } from 'drizzle-orm'
import { getProjectDb } from '@/lib/infrastructure/database/connections/project-connections'
import type { IQueryRepository } from '@/lib/core/domain/interfaces/query.repository.interface'
import type { QueryResult, SavedQuery, CreateSavedQueryData, UpdateSavedQueryData } from '@/lib/core/domain/entities/query.entity'
import { logger } from '@/lib/utils/logger'

export class QueryRepository implements IQueryRepository {
  async execute(projectId: string, query: string): Promise<QueryResult> {
    const db = await getProjectDb(projectId)

    const startTime = performance.now()

    try {
      const result = await db.execute<Record<string, unknown>>(sql.raw(query))
      const endTime = performance.now()

      const executionTime = Math.round(endTime - startTime)

      // Extract column names from first row
      const columns = result.length > 0 ? Object.keys(result[0]) : []

      logger.info('Query executed successfully', {
        projectId,
        rowCount: result.length,
        executionTime,
        queryPreview: query.substring(0, 100),
      })

      return {
        columns,
        rows: result,
        rowCount: result.length,
        executionTime,
        query,
        timestamp: new Date(),
      }
    } catch (error) {
      logger.error('Query execution failed', error, {
        projectId,
        queryPreview: query.substring(0, 100),
      })
      throw error
    }
  }

  async getSavedQueries(projectId: string, userId: string): Promise<SavedQuery[]> {
    // For now, return empty array
    // Future: Implement saved queries table and query logic
    logger.debug('getSavedQueries called', { projectId, userId })
    return []
  }

  async getSavedQueryById(id: string): Promise<SavedQuery | null> {
    // For now, return null
    // Future: Implement saved queries table and query logic
    logger.debug('getSavedQueryById called', { id })
    return null
  }

  async createSavedQuery(data: CreateSavedQueryData): Promise<SavedQuery> {
    // For now, return mock saved query
    // Future: Implement saved queries table and insert logic
    logger.info('createSavedQuery called', {
      projectId: data.projectId,
      userId: data.userId,
      name: data.name,
    })

    return {
      id: crypto.randomUUID(),
      projectId: data.projectId,
      userId: data.userId,
      name: data.name,
      query: data.query,
      description: data.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  async updateSavedQuery(id: string, data: UpdateSavedQueryData): Promise<SavedQuery> {
    // For now, throw error
    // Future: Implement saved queries table and update logic
    logger.warn('updateSavedQuery not yet implemented', { id, data })
    throw new Error('updateSavedQuery not yet implemented')
  }

  async deleteSavedQuery(id: string): Promise<void> {
    // For now, do nothing
    // Future: Implement saved queries table and delete logic
    logger.warn('deleteSavedQuery not yet implemented', { id })
  }
}
