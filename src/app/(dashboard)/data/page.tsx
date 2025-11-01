'use client'

/**
 * Data Browser Page
 * Browse and manage data from all tables in the active project
 */

import { useEffect, useState, useMemo } from 'react'
import { useActiveProject } from '@/components/providers/project-provider'
import {
  getTablesAction,
  getTableDataAction,
  getTableSchemaAction,
} from '@/actions/data/table-actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Database, Table as TableIcon, RefreshCw, Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data/data-table-column-header'
import { DataTableRowActions, type RowAction } from '@/components/data/data-table-row-actions'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateRecordDialog } from '@/components/data/create-record-dialog'
import { EditRecordDialog } from '@/components/data/edit-record-dialog'
import { DeleteRecordDialog } from '@/components/data/delete-record-dialog'
import { type FieldSchema } from '@/components/data/dynamic-form'

type TableInfo = {
  name: string
  schema: string
  rowCount: number
}

export default function DataBrowserPage() {
  const { activeProject } = useActiveProject()
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([])
  const [tableSchema, setTableSchema] = useState<FieldSchema[]>([])
  const [columns, setColumns] = useState<ColumnDef<Record<string, unknown>>[]>([])
  const [isLoadingTables, setIsLoadingTables] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null)

  // Get primary key from schema
  const primaryKey = useMemo(() => {
    return tableSchema.find((col) => col.isPrimaryKey)?.name || 'id'
  }, [tableSchema])

  useEffect(() => {
    if (activeProject) {
      loadTables()
    }
  }, [activeProject])

  useEffect(() => {
    if (selectedTable && activeProject) {
      loadTableData(selectedTable)
    }
  }, [selectedTable, activeProject])

  async function loadTables() {
    if (!activeProject) return

    setIsLoadingTables(true)
    const result = await getTablesAction(activeProject.id)

    if (result.success && result.data) {
      const tablesData = result.data as unknown as TableInfo[]
      setTables(tablesData)

      // Auto-select first table
      if (tablesData.length > 0 && !selectedTable) {
        setSelectedTable(tablesData[0].name)
      }
    } else {
      toast.error('error' in result ? result.error : 'Failed to load tables')
    }

    setIsLoadingTables(false)
  }

  async function loadTableData(tableName: string) {
    if (!activeProject) return

    setIsLoadingData(true)

    // Fetch both table data and schema
    const [dataResult, schemaResult] = await Promise.all([
      getTableDataAction(activeProject.id, tableName, {
        page: 1,
        limit: 100,
      }),
      getTableSchemaAction(activeProject.id, tableName),
    ])

    if (dataResult.success && dataResult.data && schemaResult.success && schemaResult.data) {
      const tableDataResponse = dataResult.data as { rows: Record<string, unknown>[] }
      const schemaDataRaw = schemaResult.data as {
        columnName: string
        dataType: string
        isNullable: boolean
        defaultValue: string | null
        isPrimaryKey: boolean
      }[]

      // Map ColumnInfo to FieldSchema
      const schemaData: FieldSchema[] = schemaDataRaw.map((col) => ({
        name: col.columnName,
        type: col.dataType,
        nullable: col.isNullable,
        defaultValue: col.defaultValue,
        isPrimaryKey: col.isPrimaryKey,
        isForeignKey: false, // TODO: Add foreign key detection
        foreignKeyTable: null,
        foreignKeyColumn: null,
      }))

      setTableData(tableDataResponse.rows)
      setTableSchema(schemaData)

      // Generate columns from schema with actions
      const generatedColumns: ColumnDef<Record<string, unknown>>[] = [
        ...schemaData.map((col): ColumnDef<Record<string, unknown>> => ({
          accessorKey: col.name,
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={col.name} />
          ),
          cell: ({ row }) => {
            const value = row.getValue(col.name)
            if (value === null || value === undefined) {
              return <span className="text-muted-foreground">NULL</span>
            }
            if (typeof value === 'object') {
              return <code className="text-xs">{JSON.stringify(value)}</code>
            }
            if (typeof value === 'boolean') {
              return (
                <Badge variant={value ? 'default' : 'secondary'}>
                  {value.toString()}
                </Badge>
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
                onClick: () => handleEdit(row.original),
              },
              {
                label: 'Delete',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: () => handleDelete(row.original),
                variant: 'destructive',
                separator: true,
              },
            ]
            return <DataTableRowActions row={row} actions={actions} />
          },
        },
      ]

      setColumns(generatedColumns)
    } else {
      const errorMessage = 'error' in dataResult
        ? dataResult.error
        : 'error' in schemaResult
        ? schemaResult.error
        : 'Failed to load table data'
      toast.error(errorMessage)
    }

    setIsLoadingData(false)
  }

  function handleRefresh() {
    if (selectedTable) {
      loadTableData(selectedTable)
    }
  }

  function handleCreate() {
    setCreateDialogOpen(true)
  }

  function handleEdit(record: Record<string, unknown>) {
    setSelectedRecord(record)
    setEditDialogOpen(true)
  }

  function handleDelete(record: Record<string, unknown>) {
    setSelectedRecord(record)
    setDeleteDialogOpen(true)
  }

  function handleDialogSuccess() {
    if (selectedTable) {
      loadTableData(selectedTable)
    }
  }

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
              {isLoadingTables ? (
                'Loading...'
              ) : (
                `${tables.length} table${tables.length !== 1 ? 's' : ''} found`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTables ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : tables.length === 0 ? (
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
                    <div className="flex-1 text-left truncate">
                      {table.name}
                    </div>
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
                <CardTitle>
                  {selectedTable || 'Select a table'}
                </CardTitle>
                <CardDescription>
                  {selectedTable && !isLoadingData
                    ? `${tableData.length} row${tableData.length !== 1 ? 's' : ''}`
                    : 'View and manage table data'}
                </CardDescription>
              </div>
              {selectedTable && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoadingData}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={isLoadingData}
                  >
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
                isLoading={isLoadingData}
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
            schema={tableSchema}
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onSuccess={handleDialogSuccess}
          />

          {selectedRecord && (
            <>
              <EditRecordDialog
                projectId={activeProject.id}
                tableName={selectedTable}
                schema={tableSchema}
                record={selectedRecord}
                primaryKey={primaryKey}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onSuccess={handleDialogSuccess}
              />

              <DeleteRecordDialog
                projectId={activeProject.id}
                tableName={selectedTable}
                primaryKey={primaryKey}
                primaryKeyValue={selectedRecord[primaryKey] as string | number}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onSuccess={handleDialogSuccess}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
