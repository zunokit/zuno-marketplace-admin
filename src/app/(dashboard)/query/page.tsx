'use client'

/**
 * SQL Query Runner Page
 * Interactive SQL editor with execution, history, and saved queries
 * Refactored for better maintainability and type safety
 */

import { useState, useCallback, useEffect } from 'react'
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
import { Play, History, Save, Trash2, Clock, FileCode, Loader2, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { SqlEditor } from '@/components/query/sql-editor'
import { QueryResults, exportToCsv, exportToJson } from '@/components/query/query-results'
import { useQueryRunner } from '@/components/features/query/hooks/useQueryRunner'
import { useQueryHistory } from '@/components/features/query/hooks/useQueryHistory'
import type { SavedQuery } from '@/types/features/query.types'
import { formatDistanceToNow } from 'date-fns'

export default function QueryPage() {
  const {
    activeProject,
    query,
    result,
    isExecuting,
    error,
    setQuery,
    executeQuery: runQuery,
  } = useQueryRunner()

  const {
    history,
    savedQueries,
    addToHistory,
    clearHistory,
    saveQuery,
    deleteSavedQuery,
  } = useQueryHistory(activeProject?.id || null)

  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveQueryName, setSaveQueryName] = useState('')
  const [saveQueryDescription, setSaveQueryDescription] = useState('')

  const handleExecuteQuery = useCallback(async () => {
    const queryResult = await runQuery()
    if (queryResult) {
      addToHistory(queryResult)
    }
  }, [runQuery, addToHistory])

  const handleSaveQuery = useCallback(() => {
    if (!saveQueryName.trim()) {
      toast.error('Please enter a name for the query')
      return
    }

    saveQuery(saveQueryName.trim(), saveQueryDescription.trim(), query.trim())
    toast.success('Query saved successfully')

    setShowSaveDialog(false)
    setSaveQueryName('')
    setSaveQueryDescription('')
  }, [saveQueryName, saveQueryDescription, query, saveQuery])

  const loadSavedQuery = useCallback(
    (savedQuery: SavedQuery) => {
      setQuery(savedQuery.query)
      toast.success(`Loaded "${savedQuery.name}"`)
    },
    [setQuery]
  )

  const handleDeleteSavedQuery = useCallback(
    (id: string) => {
      deleteSavedQuery(id)
      toast.success('Query deleted')
    },
    [deleteSavedQuery]
  )

  const handleClearHistory = useCallback(() => {
    clearHistory()
    toast.success('History cleared')
  }, [clearHistory])

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
        <p className="text-muted-foreground">Execute SQL queries on {activeProject.name}</p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Query Permissions</AlertTitle>
        <AlertDescription>
          SELECT queries require{' '}
          <Badge variant="outline" className="mx-1">
            data.read
          </Badge>{' '}
          permission. INSERT/UPDATE/DELETE require{' '}
          <Badge variant="outline" className="mx-1">
            data.update
          </Badge>{' '}
          permission. Dangerous operations (DROP, TRUNCATE, ALTER) are blocked.
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
                  <CardDescription>Write and execute PostgreSQL queries</CardDescription>
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
                  <Button size="sm" onClick={handleExecuteQuery} disabled={isExecuting || !query.trim()}>
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Query Results</CardTitle>
                    <CardDescription>
                      {result.rowCount} row{result.rowCount !== 1 ? 's' : ''} • {result.executionTime}ms
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => exportToCsv(result)}>
                      Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToJson(result)}>
                      Export JSON
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <QueryResults result={result} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - History and Saved Queries */}
        <div className="space-y-6">
          {/* Query History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  <CardTitle className="text-base">History</CardTitle>
                </div>
                {history.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleClearHistory}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No query history yet</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {history.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(item.query)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
                        <span>•</span>
                        <span>{item.executionTime}ms</span>
                      </div>
                      <p className="text-sm font-mono truncate">{item.query}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Queries */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                <CardTitle className="text-base">Saved Queries</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {savedQueries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No saved queries yet</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {savedQueries.map((savedQuery) => (
                    <div key={savedQuery.id} className="p-3 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{savedQuery.name}</h4>
                          {savedQuery.description && (
                            <p className="text-xs text-muted-foreground mt-1">{savedQuery.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSavedQuery(savedQuery.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={() => loadSavedQuery(savedQuery)}
                      >
                        Load Query
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Query Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Query</DialogTitle>
            <DialogDescription>Give your query a name and description to save it for later use.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="query-name">Name *</Label>
              <Input
                id="query-name"
                placeholder="e.g., List all users"
                value={saveQueryName}
                onChange={(e) => setSaveQueryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="query-description">Description (optional)</Label>
              <Textarea
                id="query-description"
                placeholder="What does this query do?"
                value={saveQueryDescription}
                onChange={(e) => setSaveQueryDescription(e.target.value)}
                rows={3}
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
