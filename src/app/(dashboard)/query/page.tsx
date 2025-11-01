'use client'

/**
 * SQL Query Runner Page
 * Interactive SQL editor with execution, history, and saved queries
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useActiveProject } from '@/components/providers/project-provider'
import {
  executeQueryAction,
  type QueryResult,
  type SavedQuery,
} from '@/actions/query/query-actions'
import { SqlEditor } from '@/components/query/sql-editor'
import { QueryResults, exportToCsv, exportToJson } from '@/components/query/query-results'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Play,
  History,
  Save,
  Trash2,
  Clock,
  FileCode,
  Loader2,
  AlertCircle,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const QUERY_HISTORY_KEY = 'sql-query-history'
const SAVED_QUERIES_KEY = 'sql-saved-queries'
const MAX_HISTORY_ITEMS = 50

export default function QueryPage() {
  const { activeProject } = useActiveProject()
  const [query, setQuery] = useState('SELECT * FROM information_schema.tables LIMIT 10;')
  const [result, setResult] = useState<QueryResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // History and saved queries - initialized once and persisted per project
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([])
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveQueryName, setSaveQueryName] = useState('')
  const [saveQueryDescription, setSaveQueryDescription] = useState('')
  const currentProjectIdRef = useRef<string | null>(null)

  // Load history and saved queries when project changes
  useEffect(() => {
    // Load from localStorage asynchronously to avoid setState in effect lint error
    Promise.resolve().then(() => {
      if (!activeProject) {
        currentProjectIdRef.current = null
        setQueryHistory([])
        setSavedQueries([])
        return
      }

      // Only reload if project actually changed
      if (activeProject.id === currentProjectIdRef.current) return

      currentProjectIdRef.current = activeProject.id

      const historyKey = `${QUERY_HISTORY_KEY}-${activeProject.id}`
      const savedKey = `${SAVED_QUERIES_KEY}-${activeProject.id}`

      const storedHistory = localStorage.getItem(historyKey)
      const storedSaved = localStorage.getItem(savedKey)

      if (storedHistory) {
        try {
          setQueryHistory(JSON.parse(storedHistory))
        } catch {
          setQueryHistory([])
        }
      } else {
        setQueryHistory([])
      }

      if (storedSaved) {
        try {
          setSavedQueries(JSON.parse(storedSaved))
        } catch {
          setSavedQueries([])
        }
      } else {
        setSavedQueries([])
      }
    })
  }, [activeProject])

  const saveToHistory = useCallback(
    (queryResult: QueryResult) => {
      if (!activeProject) return

      const historyKey = `${QUERY_HISTORY_KEY}-${activeProject.id}`
      const newHistory = [queryResult, ...queryHistory].slice(0, MAX_HISTORY_ITEMS)

      setQueryHistory(newHistory)
      localStorage.setItem(historyKey, JSON.stringify(newHistory))
    },
    [activeProject, queryHistory]
  )

  const executeQuery = useCallback(async () => {
    if (!activeProject) return
    if (!query.trim()) {
      toast.error('Please enter a SQL query')
      return
    }

    setIsExecuting(true)
    setError(null)
    setResult(null)

    const startTime = performance.now()
    const queryResult = await executeQueryAction(activeProject.id, query)

    if (queryResult.success && queryResult.data) {
      setResult(queryResult.data)
      saveToHistory(queryResult.data)
      toast.success(`Query executed successfully in ${queryResult.data.executionTime}ms`)
    } else {
      const errorMessage = 'error' in queryResult ? queryResult.error : 'Failed to execute query'
      setError(errorMessage)
      toast.error(errorMessage)
    }

    setIsExecuting(false)
  }, [activeProject, query, saveToHistory])

  const handleSaveQuery = useCallback(async () => {
    if (!activeProject) return
    if (!saveQueryName.trim()) {
      toast.error('Please enter a name for the query')
      return
    }

    const newSavedQuery: SavedQuery = {
      id: crypto.randomUUID(),
      name: saveQueryName.trim(),
      query: query.trim(),
      description: saveQueryDescription.trim() || undefined,
      createdAt: new Date(),
    }

    const savedKey = `${SAVED_QUERIES_KEY}-${activeProject.id}`
    const newSavedQueries = [newSavedQuery, ...savedQueries]

    setSavedQueries(newSavedQueries)
    localStorage.setItem(savedKey, JSON.stringify(newSavedQueries))

    toast.success('Query saved successfully')
    setShowSaveDialog(false)
    setSaveQueryName('')
    setSaveQueryDescription('')
  }, [activeProject, query, saveQueryName, saveQueryDescription, savedQueries])

  const loadSavedQuery = useCallback((savedQuery: SavedQuery) => {
    setQuery(savedQuery.query)
    toast.success(`Loaded "${savedQuery.name}"`)
  }, [])

  const deleteSavedQuery = useCallback(
    (id: string) => {
      if (!activeProject) return

      const savedKey = `${SAVED_QUERIES_KEY}-${activeProject.id}`
      const newSavedQueries = savedQueries.filter((q) => q.id !== id)

      setSavedQueries(newSavedQueries)
      localStorage.setItem(savedKey, JSON.stringify(newSavedQueries))

      toast.success('Query deleted')
    },
    [activeProject, savedQueries]
  )

  const clearHistory = useCallback(() => {
    if (!activeProject) return

    const historyKey = `${QUERY_HISTORY_KEY}-${activeProject.id}`
    setQueryHistory([])
    localStorage.removeItem(historyKey)

    toast.success('History cleared')
  }, [activeProject])

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Project Selected</CardTitle>
            <CardDescription>
              Please select a project from the dropdown to run SQL queries
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">SQL Query Runner</h1>
        <p className="text-muted-foreground">
          Execute SQL queries on {activeProject.name}
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Query Permissions</AlertTitle>
        <AlertDescription>
          SELECT queries require <Badge variant="outline" className="mx-1">data.read</Badge> permission.
          INSERT/UPDATE/DELETE require <Badge variant="outline" className="mx-1">data.update</Badge> permission.
          Dangerous operations (DROP, TRUNCATE, ALTER) are blocked.
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Left Column - Editor and Results */}
        <div className="space-y-6">
          {/* SQL Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SQL Editor</CardTitle>
                  <CardDescription>
                    Write and execute PostgreSQL queries
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                    disabled={!query.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    onClick={executeQuery}
                    disabled={isExecuting || !query.trim()}
                  >
                    {isExecuting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Execute
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SqlEditor value={query} onChange={setQuery} height="250px" />
              <p className="text-xs text-muted-foreground mt-2">
                Press Ctrl+Enter to execute • Tab for autocomplete
              </p>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Query Error</AlertTitle>
              <AlertDescription className="font-mono text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {result && (
            <QueryResults
              result={result}
              onExportCsv={() => exportToCsv(result)}
              onExportJson={() => exportToJson(result)}
            />
          )}
        </div>

        {/* Right Column - History and Saved Queries */}
        <div className="space-y-6">
          {/* Saved Queries */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  Saved Queries
                </CardTitle>
                <Badge variant="outline">{savedQueries.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {savedQueries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No saved queries yet
                  </p>
                ) : (
                  savedQueries.map((savedQuery) => (
                    <div
                      key={savedQuery.id}
                      className="flex items-start justify-between gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => loadSavedQuery(savedQuery)}
                      >
                        <p className="font-medium text-sm">{savedQuery.name}</p>
                        {savedQuery.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {savedQuery.description}
                          </p>
                        )}
                        <p className="text-xs font-mono text-muted-foreground mt-1 truncate">
                          {savedQuery.query}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteSavedQuery(savedQuery.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Query History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  History
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{queryHistory.length}</Badge>
                  {queryHistory.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearHistory}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {queryHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No query history yet
                  </p>
                ) : (
                  queryHistory.map((historyItem, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setQuery(historyItem.query)}
                    >
                      <Clock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono truncate">{historyItem.query}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {historyItem.rowCount} rows
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {historyItem.executionTime}ms
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Query Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Query</DialogTitle>
            <DialogDescription>
              Save this query for later use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="queryName">Name</Label>
              <Input
                id="queryName"
                value={saveQueryName}
                onChange={(e) => setSaveQueryName(e.target.value)}
                placeholder="e.g., Get all users"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="queryDescription">Description (optional)</Label>
              <Textarea
                id="queryDescription"
                value={saveQueryDescription}
                onChange={(e) => setSaveQueryDescription(e.target.value)}
                placeholder="What does this query do?"
                rows={3}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuery}>Save Query</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
