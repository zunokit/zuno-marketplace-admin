'use client'

/**
 * Schema Visualization Page
 * Interactive ER diagram showing database structure
 */

import { useEffect, useState, useCallback } from 'react'
import { useActiveProject } from '@/components/providers/project-provider'
import { getCompleteSchemaAction, type CompleteSchemaInfo, type TableSchemaInfo } from '@/actions/schema/schema-actions'
import { SchemaGraph } from '@/components/schema/schema-graph'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Database, Key, Link2, Hash, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function SchemaPage() {
  const { activeProject } = useActiveProject()
  const [schema, setSchema] = useState<CompleteSchemaInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)

  const loadSchema = useCallback(async () => {
    if (!activeProject) return

    setIsLoading(true)
    const result = await getCompleteSchemaAction(activeProject.id)

    if (result.success && result.data) {
      setSchema(result.data)
    } else {
      toast.error('error' in result ? result.error : 'Failed to load schema')
    }

    setIsLoading(false)
  }, [activeProject])

  useEffect(() => {
    if (!activeProject) return

    // Call async function directly to avoid lint error about setState in effect
    let isMounted = true

    const fetchSchema = async () => {
      setIsLoading(true)
      const result = await getCompleteSchemaAction(activeProject.id)

      if (!isMounted) return

      if (result.success && result.data) {
        setSchema(result.data)
      } else {
        toast.error('error' in result ? result.error : 'Failed to load schema')
      }

      setIsLoading(false)
    }

    fetchSchema()

    return () => {
      isMounted = false
    }
  }, [activeProject])

  const selectedTableData = schema?.tables.find((t) => t.tableName === selectedTable)

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Project Selected</CardTitle>
            <CardDescription>
              Please select a project from the dropdown to view its schema
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
          <h1 className="text-3xl font-bold">Database Schema</h1>
          <p className="text-muted-foreground">
            Visual ER diagram for {activeProject.name}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadSchema}
          disabled={isLoading}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* ER Diagram */}
        <div className="flex-1 rounded-lg border bg-card overflow-hidden">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="space-y-4 text-center">
                <Skeleton className="h-12 w-12 rounded-full mx-auto" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48 mx-auto" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                </div>
              </div>
            </div>
          ) : schema ? (
            <SchemaGraph schema={schema} onTableSelect={setSelectedTable} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground">No schema data available</p>
            </div>
          )}
        </div>

        {/* Table Details Sidebar */}
        {selectedTableData && (
          <Card className="w-96 flex flex-col overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    {selectedTableData.tableName}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {selectedTableData.rowCount} {selectedTableData.rowCount === 1 ? 'row' : 'rows'}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSelectedTable(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="flex-1 overflow-y-auto pt-4">
              <div className="space-y-4">
                {/* Columns Section */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Columns ({selectedTableData.columns.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedTableData.columns.map((column) => (
                      <div
                        key={column.columnName}
                        className={cn(
                          'rounded-lg border p-3 space-y-1.5',
                          column.isPrimaryKey && 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {column.isPrimaryKey ? (
                              <Key className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                            ) : column.isForeignKey ? (
                              <Link2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            ) : (
                              <Hash className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                            )}
                            <span className="font-mono text-sm font-medium truncate">
                              {column.columnName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {column.isPrimaryKey && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                PK
                              </Badge>
                            )}
                            {column.isForeignKey && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                FK
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono text-muted-foreground">
                            {column.dataType}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {column.enumValues && column.enumValues.length > 0 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                enum({column.enumValues.length})
                              </Badge>
                            )}
                            {column.isNullable && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                nullable
                              </Badge>
                            )}
                          </div>
                        </div>

                        {column.defaultValue && (
                          <div className="text-xs text-muted-foreground">
                            Default: <code className="font-mono">{column.defaultValue}</code>
                          </div>
                        )}

                        {column.isForeignKey && column.foreignKeyTable && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Link2 className="h-3 w-3" />
                            References {column.foreignKeyTable}.{column.foreignKeyColumn}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Relationships Section */}
                {schema && schema.relationships.some(
                  (rel) =>
                    rel.sourceTable === selectedTable || rel.targetTable === selectedTable
                ) && (
                  <div>
                    <Separator className="mb-3" />
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Relationships
                    </h3>
                    <div className="space-y-2">
                      {schema.relationships
                        .filter(
                          (rel) =>
                            (rel.sourceTable === selectedTable && rel.relationshipType === 'many-to-one') ||
                            (rel.targetTable === selectedTable && rel.relationshipType === 'one-to-many')
                        )
                        .map((rel, index) => (
                          <div
                            key={index}
                            className="text-sm p-2 rounded border bg-muted/30"
                          >
                            <div className="font-mono text-xs">
                              {rel.relationshipType === 'many-to-one' ? (
                                <>
                                  <span className="font-semibold">{rel.sourceColumn}</span>
                                  <span className="text-muted-foreground mx-1">→</span>
                                  <span className="text-blue-600 dark:text-blue-400">
                                    {rel.targetTable}.{rel.targetColumn}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-blue-600 dark:text-blue-400">
                                    {rel.sourceTable}.{rel.sourceColumn}
                                  </span>
                                  <span className="text-muted-foreground mx-1">→</span>
                                  <span className="font-semibold">{rel.targetColumn}</span>
                                </>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {rel.relationshipType}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
