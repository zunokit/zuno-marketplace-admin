/**
 * Query Domain Entity
 * Represents SQL query execution and saved queries
 */

export interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  executionTime: number
  query: string
  timestamp: Date
}

export interface SavedQuery {
  id: string
  projectId: string
  userId: string
  name: string
  query: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface QueryExecutionParams {
  projectId: string
  query: string
  userId: string
}

export interface QueryValidationResult {
  isValid: boolean
  isReadOnly: boolean
  isDangerous: boolean
  errors: string[]
}

export interface CreateSavedQueryData {
  projectId: string
  userId: string
  name: string
  query: string
  description?: string
}

export interface UpdateSavedQueryData {
  name?: string
  query?: string
  description?: string
}
