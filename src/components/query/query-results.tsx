'use client'

/**
 * QueryResults Component
 * Displays query results in a scrollable table
 */


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileJson, FileText } from 'lucide-react'
import type { QueryResult } from '@/app/actions/query/query-actions'

type QueryResultsProps = {
  result: QueryResult
  onExportCsv?: () => void
  onExportJson?: () => void
}

export function QueryResults({ result, onExportCsv, onExportJson }: QueryResultsProps) {
  const { columns, rows, rowCount, executionTime } = result

  // Format cell value for display
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return 'NULL'
    }
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false'
    }
    return String(value)
  }

  // Check if value is NULL
  const isNull = (value: unknown): boolean => {
    return value === null || value === undefined
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Query Results</CardTitle>
            <CardDescription>
              {rowCount} {rowCount === 1 ? 'row' : 'rows'} returned in {executionTime}ms
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onExportCsv && (
              <Button variant="outline" size="sm" onClick={onExportCsv}>
                <FileText className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
            {onExportJson && (
              <Button variant="outline" size="sm" onClick={onExportJson}>
                <FileJson className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Query returned no results
          </div>
        ) : (
          <div className="border rounded-lg overflow-auto max-h-[500px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  {columns.map((column) => (
                    <TableHead key={column} className="font-mono text-xs">
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {rowIndex + 1}
                    </TableCell>
                    {columns.map((column) => {
                      const value = row[column]
                      const cellIsNull = isNull(value)

                      return (
                        <TableCell key={column} className="font-mono text-xs">
                          {cellIsNull ? (
                            <span className="text-muted-foreground italic">NULL</span>
                          ) : typeof value === 'boolean' ? (
                            <Badge variant={value ? 'default' : 'secondary'}>
                              {formatValue(value)}
                            </Badge>
                          ) : typeof value === 'object' ? (
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {formatValue(value)}
                            </code>
                          ) : (
                            <span className="max-w-md truncate inline-block">
                              {formatValue(value)}
                            </span>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Export results as CSV
 */
export function exportToCsv(result: QueryResult): void {
  const { columns, rows } = result

  // Create CSV header
  const csvHeader = columns.join(',')

  // Create CSV rows
  const csvRows = rows.map((row) =>
    columns
      .map((col) => {
        const value = row[col]
        if (value === null || value === undefined) return 'NULL'
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`
        return String(value)
      })
      .join(',')
  )

  // Combine header and rows
  const csv = [csvHeader, ...csvRows].join('\n')

  // Create download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `query-results-${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Export results as JSON
 */
export function exportToJson(result: QueryResult): void {
  const { rows } = result

  const json = JSON.stringify(rows, null, 2)

  // Create download link
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `query-results-${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
}
