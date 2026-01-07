'use client'

/**
 * Data Browser Page
 * Browse and manage data from all tables in the active project
 * Refactored for better maintainability and type safety
 */

import { useState, useCallback, useMemo } from 'react'
import { Database, Table as TableIcon, RefreshCw, Plus } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data/data-table'
import { CreateRecordDialog } from '@/components/data/create-record-dialog'
import { EditRecordDialog } from '@/components/data/edit-record-dialog'
import { DeleteRecordDialog } from '@/components/data/delete-record-dialog'
import { useDataTable } from '@/components/features/data/hooks/useDataTable'
import { useDataBrowserColumns } from '@/components/features/data/components/DataBrowserColumns'

export default function DataBrowserPage() {
  const {
    activeProject,
    tables,
    selectedTable,
    tableData,
    tableSchema,
    primaryKey,
    setSelectedTable,
    refreshTableData,
  } = useDataTable()

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null)

  const handleEdit = useCallback((record: Record<string, unknown>) => {
    setSelectedRecord(record)
    setEditDialogOpen(true)
  }, [])

  const handleDelete = useCallback((record: Record<string, unknown>) => {
    setSelectedRecord(record)
    setDeleteDialogOpen(true)
  }, [])

  // Generate table columns from schema using custom hook
  const columns = useDataBrowserColumns({
    tableSchema,
    onEdit: handleEdit,
    onDelete: handleDelete,
  })

  // Convert ColumnInfo to FieldSchema for dialogs
  const fieldSchema = useMemo(
    () =>
      tableSchema.map((col) => ({
        name: col.columnName,
        type: col.dataType,
        nullable: col.isNullable,
        defaultValue: col.defaultValue,
        isPrimaryKey: col.isPrimaryKey,
        isForeignKey: col.isForeignKey || false,
        foreignKeyTable: col.foreignKeyTable || null,
        foreignKeyColumn: col.foreignKeyColumn || null,
        enumValues: col.enumValues || null,
      })),
    [tableSchema]
  )

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Project Selected</CardTitle>
            <CardDescription>
              Please select a project from the dropdown to browse data
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Browser</h1>
          <p className="text-muted-foreground">
            Browse and manage data tables in {activeProject.name}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        {/* Table List Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Tables
            </CardTitle>
            <CardDescription>
              {tables.length} table{tables.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tables.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No tables found in this database
              </div>
            ) : (
              <div className="space-y-1">
                {tables.map((table) => (
                  <Button
                    key={table.name}
                    variant={selectedTable === table.name ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedTable(table.name)}
                  >
                    <TableIcon className="mr-2 h-4 w-4" />
                    <div className="flex-1 text-left truncate">{table.name}</div>
                    <Badge variant="outline" className="ml-2">
                      {table.rowCount}
                    </Badge>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table Data View */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedTable || 'Select a table'}</CardTitle>
                <CardDescription>
                  {selectedTable
                    ? `${tableData.length} row${tableData.length !== 1 ? 's' : ''}`
                    : 'View and manage table data'}
                </CardDescription>
              </div>
              {selectedTable && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={refreshTableData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Record
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedTable ? (
              <DataTable
                columns={columns}
                data={tableData}
                emptyMessage="No data found in this table"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TableIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No table selected</p>
                <p className="text-sm text-muted-foreground">
                  Select a table from the sidebar to view its data
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CRUD Dialogs */}
      {activeProject && selectedTable && (
        <>
          <CreateRecordDialog
            projectId={activeProject.id}
            tableName={selectedTable}
            schema={fieldSchema}
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onSuccess={refreshTableData}
          />

          {selectedRecord && (
            <>
              <EditRecordDialog
                projectId={activeProject.id}
                tableName={selectedTable}
                schema={fieldSchema}
                record={selectedRecord}
                primaryKey={primaryKey}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onSuccess={refreshTableData}
              />

              <DeleteRecordDialog
                projectId={activeProject.id}
                tableName={selectedTable}
                primaryKey={primaryKey}
                primaryKeyValue={selectedRecord[primaryKey] as string | number}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onSuccess={refreshTableData}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
