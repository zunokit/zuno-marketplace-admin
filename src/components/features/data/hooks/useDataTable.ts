/**
 * useDataTable Hook
 * Manages data table state and operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useActiveProject } from '@/components/providers/project-provider'
import {
  getTablesAction,
  getTableDataAction,
  getTableSchemaAction,
} from '@/app/actions/data/table-actions'
import { toast } from 'sonner'
import type { TableInfo } from '../types'
import type { ColumnInfo, TableDataResponse } from '@/types/api.types'

export function useDataTable() {
  const { activeProject } = useActiveProject()
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([])
  const [tableSchema, setTableSchema] = useState<ColumnInfo[]>([])

  // Get primary key from schema
  const primaryKey = useMemo(() => {
    return tableSchema.find((col) => col.isPrimaryKey)?.columnName || 'id'
  }, [tableSchema])

  const loadTables = useCallback(async () => {
    if (!activeProject) return

    const result = await getTablesAction(activeProject.id)

    if (result.success && result.data) {
      const tablesData = result.data.map((table) => ({
        name: table.tableName,
        schema: table.schemaName,
        rowCount: table.rowCount,
      }))
      setTables(tablesData)

      // Auto-select first table
      if (tablesData.length > 0 && !selectedTable) {
        setSelectedTable(tablesData[0].name)
      }
    } else if (!result.success && 'error' in result) {
      toast.error(result.error)
    }
  }, [activeProject, selectedTable])

  const loadTableData = useCallback(
    async (tableName: string) => {
      if (!activeProject) return

      const [dataResult, schemaResult] = await Promise.all([
        getTableDataAction(activeProject.id, tableName, {
          page: 1,
          limit: 100,
        }),
        getTableSchemaAction(activeProject.id, tableName),
      ])

      if (dataResult.success && dataResult.data && schemaResult.success && schemaResult.data) {
        // Handle the response data - use proper destructuring
        const { rows } = dataResult.data
        const schemaData = schemaResult.data

        setTableData(rows)
        setTableSchema(schemaData)
      } else {
        const errorMessage =
          !dataResult.success && 'error' in dataResult
            ? dataResult.error
            : !schemaResult.success && 'error' in schemaResult
            ? schemaResult.error
            : 'Failed to load table data'
        toast.error(errorMessage)
      }
    },
    [activeProject]
  )

  const refreshTableData = useCallback(() => {
    if (selectedTable) {
      loadTableData(selectedTable)
    }
  }, [selectedTable, loadTableData])

  useEffect(() => {
    if (activeProject) {
      void loadTables()
    }
  }, [activeProject, loadTables])

  useEffect(() => {
    if (selectedTable && activeProject) {
      void loadTableData(selectedTable)
    }
  }, [selectedTable, activeProject, loadTableData])

  return {
    // State
    activeProject,
    tables,
    selectedTable,
    tableData,
    tableSchema,
    primaryKey,

    // Actions
    setSelectedTable,
    refreshTableData,
  }
}
