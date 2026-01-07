'use client'

/**
 * Schema Explorer Page
 * Detailed schema browser with metadata, statistics, and DDL viewer
 */

import { useEffect, useState, useCallback } from 'react'
import { useActiveProject } from '@/components/providers/project-provider'
import { getCompleteSchemaAction, getDatabaseStatisticsAction, type CompleteSchemaInfo, type DatabaseStatistics } from '@/app/actions/schema/schema-actions'
import { SchemaExplorerSidebar } from '@/components/schema/schema-explorer-sidebar'
import { TableDetailsPanel } from '@/components/schema/table-details-panel'
import { SchemaStatistics } from '@/components/schema/schema-statistics'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, Database } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function SchemaExplorerPage() {
  const { activeProject } = useActiveProject()
  const [schema, setSchema] = useState<CompleteSchemaInfo | null>(null)
  const [statistics, setStatistics] = useState<DatabaseStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)

  useEffect(() => {
    if (!activeProject) return

    const loadData = async () => {
      setIsLoading(true)

      const [schemaResult, statsResult] = await Promise.all([
        getCompleteSchemaAction(activeProject.id),
        getDatabaseStatisticsAction(activeProject.id),
      ])

      if (schemaResult.success && schemaResult.data) {
        setSchema(schemaResult.data)
      } else {
        toast.error('error' in schemaResult ? schemaResult.error : 'Failed to load schema')
      }

      if (statsResult.success && statsResult.data) {
        setStatistics(statsResult.data)
      } else {
        toast.error('error' in statsResult ? statsResult.error : 'Failed to load statistics')
      }

      setIsLoading(false)
    }

    loadData()
  }, [activeProject])

  const refreshData = useCallback(async () => {
    if (!activeProject) return

    setIsLoading(true)

    const [schemaResult, statsResult] = await Promise.all([
      getCompleteSchemaAction(activeProject.id),
      getDatabaseStatisticsAction(activeProject.id),
    ])

    if (schemaResult.success && schemaResult.data) {
      setSchema(schemaResult.data)
    } else {
      toast.error('error' in schemaResult ? schemaResult.error : 'Failed to load schema')
    }

    if (statsResult.success && statsResult.data) {
      setStatistics(statsResult.data)
    } else {
      toast.error('error' in statsResult ? statsResult.error : 'Failed to load statistics')
    }

    setIsLoading(false)
  }, [activeProject])

  const selectedTableData = schema?.tables.find((t) => t.tableName === selectedTable)

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Project Selected</CardTitle>
            <CardDescription>
              Please select a project from the dropdown to explore its schema
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            Schema Explorer
          </h1>
          <p className="text-muted-foreground mt-1">
            Detailed schema browser for {activeProject.name}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={isLoading}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Statistics Section */}
      {isLoading ? (
        <div className="mb-6">
          <Skeleton className="h-32 w-full" />
        </div>
      ) : statistics ? (
        <div className="mb-6">
          <SchemaStatistics statistics={statistics} />
        </div>
      ) : null}

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : schema ? (
            <SchemaExplorerSidebar
              schema={schema}
              selectedTable={selectedTable}
              onTableSelect={setSelectedTable}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  No schema data available
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Details Panel */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : selectedTableData && activeProject ? (
            <TableDetailsPanel
              projectId={activeProject.id}
              table={selectedTableData}
              schema={schema}
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent>
                <div className="text-center text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No Table Selected</p>
                  <p className="text-sm mt-1">
                    Select a table from the sidebar to view its details
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
