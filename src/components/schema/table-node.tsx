'use client'

/**
 * TableNode Component
 * Renders a table card in the ER diagram with columns, types, and keys
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database, Key, Link2, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TableNodeData = {
  tableName: string
  schemaName: string
  rowCount: number
  columns: {
    columnName: string
    dataType: string
    isPrimaryKey: boolean
    isForeignKey: boolean
    isNullable: boolean
    enumValues: string[] | null
  }[]
  isSelected?: boolean
}

export const TableNode = memo(({ data, selected }: NodeProps) => {
  const tableData = data as TableNodeData
  const { tableName, rowCount, columns } = tableData

  return (
    <div className="relative">
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      <Handle type="source" position={Position.Right} className="!bg-primary" />

      <Card
        className={cn(
          'min-w-[280px] max-w-[400px] shadow-md transition-all',
          selected && 'ring-2 ring-primary ring-offset-2',
          'hover:shadow-lg'
        )}
      >
        <CardHeader className="pb-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              {tableName}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {rowCount} {rowCount === 1 ? 'row' : 'rows'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {columns.map((column: TableNodeData['columns'][number]) => (
              <div
                key={column.columnName}
                className={cn(
                  'flex items-center justify-between gap-2 py-1.5 px-2 rounded text-sm hover:bg-muted/50 transition-colors',
                  column.isPrimaryKey && 'bg-primary/5'
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Icon indicators */}
                  <div className="flex-shrink-0">
                    {column.isPrimaryKey ? (
                      <Key className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500" />
                    ) : column.isForeignKey ? (
                      <Link2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Hash className="h-3.5 w-3.5 text-muted-foreground/50" />
                    )}
                  </div>

                  {/* Column name */}
                  <span
                    className={cn(
                      'font-mono text-xs truncate',
                      column.isPrimaryKey && 'font-semibold',
                      column.isNullable && 'text-muted-foreground'
                    )}
                  >
                    {column.columnName}
                  </span>
                </div>

                {/* Data type */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {column.enumValues && column.enumValues.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      enum({column.enumValues.length})
                    </Badge>
                  )}
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {column.dataType}
                  </span>
                  {column.isNullable && (
                    <span className="text-[10px] text-muted-foreground/70">?</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

TableNode.displayName = 'TableNode'
