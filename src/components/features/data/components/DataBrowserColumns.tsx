/**
 * Data Browser Columns Component
 * Generates dynamic TanStack table columns from database schema
 */

import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Edit, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data/data-table-column-header'
import { DataTableRowActions } from '@/components/data/data-table-row-actions'
import type { RowAction } from '@/types/ui.types'
import type { ColumnInfo } from '@/types/api.types'

interface DataBrowserColumnsProps {
  tableSchema: ColumnInfo[]
  onEdit: (record: Record<string, unknown>) => void
  onDelete: (record: Record<string, unknown>) => void
}

export function useDataBrowserColumns({
  tableSchema,
  onEdit,
  onDelete,
}: DataBrowserColumnsProps): ColumnDef<Record<string, unknown>>[] {
  return useMemo((): ColumnDef<Record<string, unknown>>[] => {
    if (tableSchema.length === 0) return []

    return [
      ...tableSchema.map((col): ColumnDef<Record<string, unknown>> => ({
        accessorKey: col.columnName,
        header: ({ column }) => <DataTableColumnHeader column={column} title={col.columnName} />,
        cell: ({ row }) => {
          const value = row.getValue(col.columnName)
          if (value === null || value === undefined) {
            return <span className="text-muted-foreground">NULL</span>
          }
          if (typeof value === 'object') {
            return <code className="text-xs">{JSON.stringify(value)}</code>
          }
          if (typeof value === 'boolean') {
            return (
              <Badge variant={value ? 'default' : 'secondary'}>{value.toString()}</Badge>
            )
          }
          return <div className="max-w-[500px] truncate">{String(value)}</div>
        },
      })),
      {
        id: 'actions',
        cell: ({ row }) => {
          const actions: RowAction<Record<string, unknown>>[] = [
            {
              label: 'Edit',
              icon: <Edit className="h-4 w-4" />,
              onClick: (record) => onEdit(record),
            },
            {
              label: 'Delete',
              icon: <Trash2 className="h-4 w-4" />,
              onClick: (record) => onDelete(record),
              variant: 'destructive',
              separator: true,
            },
          ]
          return <DataTableRowActions row={row} actions={actions} />
        },
      },
    ]
  }, [tableSchema, onEdit, onDelete])
}
