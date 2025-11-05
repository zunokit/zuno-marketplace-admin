/**
 * Data Feature Types
 * Types specific to the data management feature
 */

import type { ColumnInfo, TableInfo } from '@/types/api.types'

export interface TableColumn extends ColumnInfo {
  // Extended column info if needed
}

// Re-export commonly used types
export type { TableInfo, ColumnInfo }

export interface DataTableState {
  selectedTable: string | null
  tableData: Record<string, unknown>[]
  tableSchema: ColumnInfo[]
  primaryKey: string
}

export interface DataTableActions {
  onRefresh: () => void
  onCreate: () => void
  onEdit: (record: Record<string, unknown>) => void
  onDelete: (record: Record<string, unknown>) => void
}

export interface DialogState {
  create: boolean
  edit: boolean
  delete: boolean
  selectedRecord: Record<string, unknown> | null
}
