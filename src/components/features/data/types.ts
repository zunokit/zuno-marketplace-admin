/**
 * Data Feature Types
 * Types specific to the data management feature
 */

import type { ColumnInfo } from '@/types/api.types'

export interface TableInfo {
  name: string
  schema: string
  rowCount: number
}

// Extended column info if needed
export type TableColumn = ColumnInfo

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
