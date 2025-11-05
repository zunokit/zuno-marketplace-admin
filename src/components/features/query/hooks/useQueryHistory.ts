/**
 * useQueryHistory Hook
 * Manages query history and saved queries with localStorage persistence
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import type { QueryResult, SavedQuery } from '../types'
import { QUERY_HISTORY_KEY, SAVED_QUERIES_KEY, MAX_HISTORY_ITEMS } from '../types'

export function useQueryHistory(projectId: string | null) {
  const [history, setHistory] = useState<QueryResult[]>([])
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const currentProjectIdRef = useRef<string | null>(null)

  // Load from localStorage when project changes
  useEffect(() => {
    if (!projectId) {
      currentProjectIdRef.current = null
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid pattern: clearing state when no project
      setHistory([])
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid pattern: clearing state when no project
      setSavedQueries([])
      return
    }

    // Only reload if project actually changed
    if (projectId === currentProjectIdRef.current) return

    currentProjectIdRef.current = projectId

    const historyKey = `${QUERY_HISTORY_KEY}-${projectId}`
    const savedKey = `${SAVED_QUERIES_KEY}-${projectId}`

    const storedHistory = localStorage.getItem(historyKey)
    const storedSaved = localStorage.getItem(savedKey)

    if (storedHistory) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid pattern: loading from localStorage
        setHistory(JSON.parse(storedHistory))
      } catch {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid pattern: loading from localStorage
        setHistory([])
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid pattern: loading from localStorage
      setHistory([])
    }

    if (storedSaved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid pattern: loading from localStorage
        setSavedQueries(JSON.parse(storedSaved))
      } catch {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid pattern: loading from localStorage
        setSavedQueries([])
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid pattern: loading from localStorage
      setSavedQueries([])
    }
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
