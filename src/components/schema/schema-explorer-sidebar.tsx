'use client'

/**
 * Schema Explorer Sidebar
 * Tree view of all tables with search and filtering
 */

import { useState, useMemo } from 'react'
import { type CompleteSchemaInfo } from '@/actions/schema/schema-actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Database, Table, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SchemaExplorerSidebarProps {
  schema: CompleteSchemaInfo
  selectedTable: string | null
  onTableSelect: (tableName: string) => void
}

export function SchemaExplorerSidebar({
  schema,
  selectedTable,
  onTableSelect,
}: SchemaExplorerSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set(['public']))

  // Group tables by schema
  const tablesBySchema = useMemo(() => {
    const grouped = new Map<string, typeof schema.tables>()

    schema.tables.forEach((table) => {
      const schemaName = table.schemaName
      if (!grouped.has(schemaName)) {
        grouped.set(schemaName, [])
      }
      grouped.get(schemaName)!.push(table)
    })

    // Sort tables within each schema
    grouped.forEach((tables) => {
      tables.sort((a, b) => a.tableName.localeCompare(b.tableName))
    })

    return grouped
  }, [schema])

  // Filter tables based on search query
  const filteredSchemas = useMemo(() => {
    if (!searchQuery.trim()) return tablesBySchema

    const filtered = new Map<string, typeof schema.tables>()
    const query = searchQuery.toLowerCase()

    tablesBySchema.forEach((tables, schemaName) => {
      const matchingTables = tables.filter((table) => {
        // Search in table name
        if (table.tableName.toLowerCase().includes(query)) return true

        // Search in column names
        return table.columns.some((col) =>
          col.columnName.toLowerCase().includes(query)
        )
      })

      if (matchingTables.length > 0) {
        filtered.set(schemaName, matchingTables)
      }
    })

    return filtered
  }, [tablesBySchema, searchQuery, schema])

  const toggleSchema = (schemaName: string) => {
    const newExpanded = new Set(expandedSchemas)
    if (newExpanded.has(schemaName)) {
      newExpanded.delete(schemaName)
    } else {
      newExpanded.add(schemaName)
    }
    setExpandedSchemas(newExpanded)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database className="h-5 w-5" />
          Tables
        </CardTitle>
        <CardDescription>
          {schema.tables.length} {schema.tables.length === 1 ? 'table' : 'tables'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tables and columns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Table List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-4">
            {Array.from(filteredSchemas.entries()).map(([schemaName, tables]) => {
              const isExpanded = expandedSchemas.has(schemaName)

              return (
                <div key={schemaName} className="space-y-1">
                  {/* Schema Header */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start font-semibold text-xs uppercase tracking-wide"
                    onClick={() => toggleSchema(schemaName)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {schemaName}
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                      {tables.length}
                    </Badge>
                  </Button>

                  {/* Tables */}
                  {isExpanded && (
                    <div className="space-y-0.5 ml-2">
                      {tables.map((table) => (
                        <Button
                          key={table.tableName}
                          variant={selectedTable === table.tableName ? 'secondary' : 'ghost'}
                          size="sm"
                          className={cn(
                            'w-full justify-start text-sm font-normal',
                            selectedTable === table.tableName && 'bg-accent font-medium'
                          )}
                          onClick={() => onTableSelect(table.tableName)}
                        >
                          <Table className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                          <span className="truncate flex-1 text-left">
                            {table.tableName}
                          </span>
                          <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 flex-shrink-0">
                            {table.rowCount}
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {filteredSchemas.size === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No tables found matching &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
