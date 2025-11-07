/**
 * useQueryHistory Hook
 * Manages query history and saved queries with localStorage persistence
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import type { QueryResult, SavedQuery } from '@/types/features/query.types'
import { QUERY_HISTORY_KEY, SAVED_QUERIES_KEY, MAX_HISTORY_ITEMS } from '@/types/features/query.types'

export function useQueryHistory(projectId: string | null) {
  const [history, setHistory] = useState<QueryResult[]>([])
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const currentProjectIdRef = useRef<string | null>(null)

  // Load from localStorage when project changes
  useEffect(() => {
    // Only reload if project actually changed
    if (projectId === currentProjectIdRef.current) return

    const loadData = () => {
      if (!projectId) {
        currentProjectIdRef.current = null
        setHistory([])
        setSavedQueries([])
        return
      }

      currentProjectIdRef.current = projectId

      const historyKey = `${QUERY_HISTORY_KEY}-${projectId}`
      const savedKey = `${SAVED_QUERIES_KEY}-${projectId}`

      const loadHistory = () => {
        const storedHistory = localStorage.getItem(historyKey)
        if (storedHistory) {
          try {
            return JSON.parse(storedHistory) as QueryResult[]
          } catch {
            return []
          }
        }
        return []
      }

      const loadSaved = () => {
        const storedSaved = localStorage.getItem(savedKey)
        if (storedSaved) {
          try {
            return JSON.parse(storedSaved) as SavedQuery[]
          } catch {
            return []
          }
        }
        return []
      }

      setHistory(loadHistory())
      setSavedQueries(loadSaved())
    }

    loadData()
  }, [projectId])

  const addToHistory = useCallback(
    (queryResult: QueryResult) => {
      if (!projectId) return

      const newHistory = [queryResult, ...history].slice(0, MAX_HISTORY_ITEMS)
      setHistory(newHistory)

      const historyKey = `${QUERY_HISTORY_KEY}-${projectId}`
      localStorage.setItem(historyKey, JSON.stringify(newHistory))
    },
    [projectId, history]
  )

  const clearHistory = useCallback(() => {
    if (!projectId) return

    setHistory([])
    const historyKey = `${QUERY_HISTORY_KEY}-${projectId}`
    localStorage.removeItem(historyKey)
  }, [projectId])

  const saveQuery = useCallback(
    (name: string, description: string, query: string) => {
      if (!projectId) return

      const newSavedQuery: SavedQuery = {
        id: crypto.randomUUID(),
        name,
        description,
        query,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const newSavedQueries = [...savedQueries, newSavedQuery]
      setSavedQueries(newSavedQueries)

      const savedKey = `${SAVED_QUERIES_KEY}-${projectId}`
      localStorage.setItem(savedKey, JSON.stringify(newSavedQueries))

      return newSavedQuery
    },
    [projectId, savedQueries]
  )

  const deleteSavedQuery = useCallback(
    (id: string) => {
      if (!projectId) return

      const newSavedQueries = savedQueries.filter((q) => q.id !== id)
      setSavedQueries(newSavedQueries)

      const savedKey = `${SAVED_QUERIES_KEY}-${projectId}`
      localStorage.setItem(savedKey, JSON.stringify(newSavedQueries))
    },
    [projectId, savedQueries]
  )

  return {
    history,
    savedQueries,
    addToHistory,
    clearHistory,
    saveQuery,
    deleteSavedQuery,
  }
}
