/**
 * Query Feature Types
 * Types specific to the SQL query runner feature
 */

export interface QueryResult {
  query: string
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  executionTime: number
  timestamp: Date
}

export interface SavedQuery {
  id: string
  name: string
  description: string
  query: string
  createdAt: Date
  updatedAt: Date
}

export interface QueryState {
  query: string
  result: QueryResult | null
  isExecuting: boolean
  error: string | null
}

export interface QueryHistoryState {
  history: QueryResult[]
  savedQueries: SavedQuery[]
}

export interface QueryActions {
  executeQuery: () => Promise<void>
  saveQuery: (name: string, description: string) => void
  loadSavedQuery: (savedQuery: SavedQuery) => void
  deleteSavedQuery: (id: string) => void
  clearHistory: () => void
}

export const QUERY_HISTORY_KEY = 'sql-query-history'
export const SAVED_QUERIES_KEY = 'sql-saved-queries'
export const MAX_HISTORY_ITEMS = 50
