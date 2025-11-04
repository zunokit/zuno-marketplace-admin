/**
 * Query Repository Interface
 * Defines the contract for query execution and management
 */

import type { QueryResult, SavedQuery, CreateSavedQueryData, UpdateSavedQueryData } from '../entities/query.entity'

export interface IQueryRepository {
  /**
   * Execute raw SQL query
   */
  execute(projectId: string, query: string): Promise<QueryResult>

  /**
   * Get saved queries for a project and user
   */
  getSavedQueries(projectId: string, userId: string): Promise<SavedQuery[]>

  /**
   * Get a single saved query by ID
   */
  getSavedQueryById(id: string): Promise<SavedQuery | null>

  /**
   * Create a saved query
   */
  createSavedQuery(data: CreateSavedQueryData): Promise<SavedQuery>

  /**
   * Update a saved query
   */
  updateSavedQuery(id: string, data: UpdateSavedQueryData): Promise<SavedQuery>

  /**
   * Delete a saved query
   */
  deleteSavedQuery(id: string): Promise<void>
}
