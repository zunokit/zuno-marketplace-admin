/**
 * useQueryRunner Hook
 * Manages SQL query execution and state
 */

import { useState, useCallback } from 'react'
import { useActiveProject } from '@/components/providers/project-provider'
import { executeQueryAction, type QueryResult } from '@/app/actions/query/query-actions'
import { toast } from 'sonner'

export function useQueryRunner() {
  const { activeProject } = useActiveProject()
  const [query, setQuery] = useState('SELECT * FROM information_schema.tables LIMIT 10;')
  const [result, setResult] = useState<QueryResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeQuery = useCallback(async () => {
    if (!activeProject) {
      toast.error('No project selected')
      return
    }

    if (!query.trim()) {
      toast.error('Please enter a query')
      return
    }

    setIsExecuting(true)
    setError(null)

    try {
      const startTime = Date.now()
      const response = await executeQueryAction(activeProject.id, query.trim())

      if (response.success && response.data) {
        const executionTime = Date.now() - startTime
        const responseData = response.data as {
          columns: string[]
          rows: Record<string, unknown>[]
          rowCount: number
        }

        const queryResult: QueryResult = {
          query: query.trim(),
          columns: responseData.columns,
          rows: responseData.rows,
          rowCount: responseData.rowCount,
          executionTime,
          timestamp: new Date(),
        }

        setResult(queryResult)
        toast.success(`Query executed successfully in ${executionTime}ms`)

        return queryResult
      } else if (!response.success && 'error' in response) {
        setError(response.error)
        toast.error(response.error)
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute query'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setIsExecuting(false)
    }
  }, [activeProject, query])

  return {
    // State
    activeProject,
    query,
    result,
    isExecuting,
    error,

    // Actions
    setQuery,
    executeQuery,
    setError,
  }
}
