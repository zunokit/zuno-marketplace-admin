'use client'

/**
 * Table Details Panel
 * Tabbed interface showing comprehensive table information
 */

import { useEffect, useState } from 'react'
import { type TableSchemaInfo, type CompleteSchemaInfo, getTableMetadataAction, getTableConstraintsAction, getTableIndexesAction, getTableDependenciesAction, getTableDDLAction, type TableMetadata, type TableConstraint, type TableIndex, type TableDependency } from '@/app/actions/schema/schema-actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Database,
  Hash,
  Key,
  Link2,
  Shield,
  Zap,
  GitBranch,
  Code2,
  Copy,
  Check,
  Info,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface TableDetailsPanelProps {
  projectId: string
  table: TableSchemaInfo
  schema?: CompleteSchemaInfo | null
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function TableDetailsPanel({ projectId, table, schema: _schema }: TableDetailsPanelProps) {
  const [metadata, setMetadata] = useState<TableMetadata | null>(null)
  const [constraints, setConstraints] = useState<TableConstraint[]>([])
  const [indexes, setIndexes] = useState<TableIndex[]>([])
  const [dependencies, setDependencies] = useState<TableDependency[]>([])
  const [ddl, setDdl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedDdl, setCopiedDdl] = useState(false)

  useEffect(() => {
    const loadTableDetails = async () => {
      setIsLoading(true)

      const [metadataResult, constraintsResult, indexesResult, dependenciesResult, ddlResult] =
        await Promise.all([
          getTableMetadataAction(projectId, table.tableName),
          getTableConstraintsAction(projectId, table.tableName),
          getTableIndexesAction(projectId, table.tableName),
          getTableDependenciesAction(projectId, table.tableName),
          getTableDDLAction(projectId, table.tableName),
        ])

      if (metadataResult.success && metadataResult.data) {
        setMetadata(metadataResult.data)
      }

      if (constraintsResult.success && constraintsResult.data) {
        setConstraints(constraintsResult.data)
      }

      if (indexesResult.success && indexesResult.data) {
        setIndexes(indexesResult.data)
      }

      if (dependenciesResult.success && dependenciesResult.data) {
        setDependencies(dependenciesResult.data)
      }

      if (ddlResult.success && ddlResult.data) {
        setDdl(ddlResult.data)
      }

      setIsLoading(false)
    }

    loadTableDetails()
  }, [projectId, table.tableName])

  const copyDdl = async () => {
    try {
      await navigator.clipboard.writeText(ddl)
      setCopiedDdl(true)
      toast.success('DDL copied to clipboard')
      setTimeout(() => setCopiedDdl(false), 2000)
    } catch {
      toast.error('Failed to copy DDL')
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never'
    return format(new Date(date), 'MMM d, yyyy h:mm a')
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {table.tableName}
            </CardTitle>
            <CardDescription className="mt-1">
              {table.rowCount.toLocaleString()} {table.rowCount === 1 ? 'row' : 'rows'}
              {metadata && ` · ${metadata.totalSize} total`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 overflow-hidden pt-4">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="columns">Columns</TabsTrigger>
            <TabsTrigger value="constraints">Constraints</TabsTrigger>
            <TabsTrigger value="indexes">Indexes</TabsTrigger>
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
            <TabsTrigger value="ddl">DDL</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="flex-1 overflow-auto mt-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : metadata ? (
              <div className="space-y-4">
                {/* Storage Information */}
                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Storage Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Table Size</div>
                      <div className="font-mono font-medium">{metadata.tableSize}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Indexes Size</div>
                      <div className="font-mono font-medium">{metadata.indexesSize}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Size</div>
                      <div className="font-mono font-medium">{metadata.totalSize}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Row Estimate</div>
                      <div className="font-mono font-medium">
                        {metadata.rowCountEstimate.toLocaleString()}
                      </div>
                    </div>
                    {metadata.hasToastTable && (
                      <div className="col-span-2">
                        <div className="text-muted-foreground">TOAST Table Size</div>
                        <div className="font-mono font-medium">{metadata.toastSize}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Maintenance Information */}
                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Maintenance Information
                  </h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Vacuum:</span>
                      <span className="font-medium">{formatDate(metadata.lastVacuum)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Auto Vacuum:</span>
                      <span className="font-medium">{formatDate(metadata.lastAutoVacuum)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Analyze:</span>
                      <span className="font-medium">{formatDate(metadata.lastAnalyze)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Auto Analyze:</span>
                      <span className="font-medium">{formatDate(metadata.lastAutoAnalyze)}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3 text-center">
                    <div className="text-2xl font-bold">{table.columns.length}</div>
                    <div className="text-xs text-muted-foreground">Columns</div>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <div className="text-2xl font-bold">{constraints.length}</div>
                    <div className="text-xs text-muted-foreground">Constraints</div>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <div className="text-2xl font-bold">{indexes.length}</div>
                    <div className="text-xs text-muted-foreground">Indexes</div>
                  </div>
                </div>
              </div>
            ) : null}
          </TabsContent>

          {/* Columns Tab */}
          <TabsContent value="columns" className="flex-1 overflow-auto mt-4">
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-4">
                {table.columns.map((column) => (
                  <div
                    key={column.columnName}
                    className={cn(
                      'rounded-lg border p-3 space-y-1.5',
                      column.isPrimaryKey &&
                        'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900'
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
                      <span className="font-mono text-muted-foreground">{column.dataType}</span>
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

                    {column.enumValues && column.enumValues.length > 0 && (
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-1 mt-1">
                        {column.enumValues.map((val) => (
                          <Badge key={val} variant="outline" className="text-[10px]">
                            {val}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Constraints Tab */}
          <TabsContent value="constraints" className="flex-1 overflow-auto mt-4">
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : constraints.length > 0 ? (
                  constraints.map((constraint) => (
                    <div key={constraint.constraintName} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm font-medium">
                            {constraint.constraintName}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {constraint.constraintType}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Columns: {constraint.columnNames.join(', ')}
                      </div>

                      {constraint.referencedTable && (
                        <div className="text-xs space-y-1">
                          <div className="text-blue-600 dark:text-blue-400">
                            References: {constraint.referencedTable} (
                            {constraint.referencedColumns?.join(', ')})
                          </div>
                          {constraint.updateRule && (
                            <div className="text-muted-foreground">
                              On Update: {constraint.updateRule}
                            </div>
                          )}
                          {constraint.deleteRule && (
                            <div className="text-muted-foreground">
                              On Delete: {constraint.deleteRule}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto">
                        {constraint.definition}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No constraints defined
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Indexes Tab */}
          <TabsContent value="indexes" className="flex-1 overflow-auto mt-4">
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : indexes.length > 0 ? (
                  indexes.map((index) => (
                    <div key={index.indexName} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm font-medium">{index.indexName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {index.isPrimary && (
                            <Badge variant="default" className="text-[10px]">
                              PRIMARY
                            </Badge>
                          )}
                          {index.isUnique && (
                            <Badge variant="secondary" className="text-[10px]">
                              UNIQUE
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px]">
                            {index.indexType.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Columns: </span>
                          <span className="font-mono">{index.columnNames.join(', ')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Size: </span>
                          <span className="font-mono">{index.indexSize}</span>
                        </div>
                      </div>

                      <div className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto">
                        {index.indexDef}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No indexes defined
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Dependencies Tab */}
          <TabsContent value="dependencies" className="flex-1 overflow-auto mt-4">
            <ScrollArea className="h-full">
              <div className="space-y-4 pr-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <>
                    {/* Referenced By */}
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        Referenced By ({dependencies.filter((d) => d.dependencyType === 'referenced_by').length})
                      </h3>
                      <div className="space-y-2">
                        {dependencies
                          .filter((d) => d.dependencyType === 'referenced_by')
                          .map((dep, index) => (
                            <div key={index} className="rounded-lg border p-3 space-y-1">
                              <div className="font-mono text-sm font-medium">
                                {dep.tableName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {dep.foreignKeyColumns.join(', ')} → {dep.referencedColumns.join(', ')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {dep.updateRule && `Update: ${dep.updateRule} · `}
                                {dep.deleteRule && `Delete: ${dep.deleteRule}`}
                              </div>
                            </div>
                          ))}
                        {dependencies.filter((d) => d.dependencyType === 'referenced_by').length === 0 && (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            No tables reference this table
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* References */}
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        References ({dependencies.filter((d) => d.dependencyType === 'references').length})
                      </h3>
                      <div className="space-y-2">
                        {dependencies
                          .filter((d) => d.dependencyType === 'references')
                          .map((dep, index) => (
                            <div key={index} className="rounded-lg border p-3 space-y-1">
                              <div className="font-mono text-sm font-medium">
                                {dep.tableName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {dep.foreignKeyColumns.join(', ')} → {dep.referencedColumns.join(', ')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {dep.updateRule && `Update: ${dep.updateRule} · `}
                                {dep.deleteRule && `Delete: ${dep.deleteRule}`}
                              </div>
                            </div>
                          ))}
                        {dependencies.filter((d) => d.dependencyType === 'references').length === 0 && (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            This table doesn&apos;t reference any tables
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* DDL Tab */}
          <TabsContent value="ddl" className="flex-1 overflow-auto mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Code2 className="h-4 w-4" />
                  CREATE TABLE Statement
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyDdl}
                  disabled={!ddl || isLoading}
                >
                  {copiedDdl ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copy DDL
                    </>
                  )}
                </Button>
              </div>

              {isLoading ? (
                <Skeleton className="h-96 w-full" />
              ) : ddl ? (
                <ScrollArea className="h-[500px]">
                  <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto">
                    {ddl}
                  </pre>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No DDL available
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
