'use client'

/**
 * Virtualized Data Table Component
 * Built with TanStack Table v8 + TanStack Virtual for high-performance rendering
 * Only renders visible rows for optimal performance with large datasets
 */

import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Settings2,
  Search,
  Download,
  Trash2,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { downloadCSV, downloadJSON } from '@/lib/utils/export'
import {
  DropdownMenu as ActionsDropdownMenu,
  DropdownMenuContent as ActionsDropdownMenuContent,
  DropdownMenuItem as ActionsDropdownMenuItem,
  DropdownMenuTrigger as ActionsDropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'

interface VirtualizedDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  isLoading?: boolean
  emptyMessage?: string
  onRowClick?: (row: TData) => void
  enableRowSelection?: boolean
  onBulkDelete?: (rows: TData[]) => Promise<void>
  exportFilename?: string
  estimatedRowHeight?: number // Estimated height of each row in pixels
  overscan?: number // Number of items to render outside viewport
}

export function VirtualizedDataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  isLoading = false,
  emptyMessage = 'No results found.',
  onRowClick,
  enableRowSelection = false,
  onBulkDelete,
  exportFilename = 'export',
  estimatedRowHeight = 53, // Default row height based on shadcn/ui table
  overscan = 5, // Render 5 extra rows above/below viewport
}: VirtualizedDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Virtual scrolling setup
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
      : 0

  async function handleBulkDelete() {
    if (!onBulkDelete) return

    const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original)

    setIsBulkDeleting(true)
    await onBulkDelete(selectedRows)
    setIsBulkDeleting(false)
    setRowSelection({})
  }

  function handleExportCSV() {
    const exportData = table.getFilteredRowModel().rows.map((row) => row.original as Record<string, unknown>)
    downloadCSV(exportData, exportFilename)
  }

  function handleExportJSON() {
    const exportData = table.getFilteredRowModel().rows.map((row) => row.original as Record<string, unknown>)
    downloadJSON(exportData, exportFilename)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        {searchKey && (
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                  table.getColumn(searchKey)?.setFilterValue(event.target.value)
                }
                className="pl-9"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {/* Bulk actions */}
          {table.getFilteredSelectedRowModel().rows.length > 0 && onBulkDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({table.getFilteredSelectedRowModel().rows.length})
            </Button>
          )}

          {/* Export menu */}
          <ActionsDropdownMenu>
            <ActionsDropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </ActionsDropdownMenuTrigger>
            <ActionsDropdownMenuContent align="end">
              <ActionsDropdownMenuItem onClick={handleExportCSV}>
                Export as CSV
              </ActionsDropdownMenuItem>
              <ActionsDropdownMenuItem onClick={handleExportJSON}>
                Export as JSON
              </ActionsDropdownMenuItem>
            </ActionsDropdownMenuContent>
          </ActionsDropdownMenu>

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="mr-2 h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Virtualized Table */}
      <div className="rounded-md border">
        <div
          ref={tableContainerRef}
          className="h-[600px] overflow-auto relative"
          style={{
            contain: 'strict', // CSS containment for better performance
          }}
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading state
                Array.from({ length: 10 }).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                // Empty state
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {/* Top padding */}
                  {paddingTop > 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        style={{ height: `${paddingTop}px` }}
                      />
                    </TableRow>
                  )}

                  {/* Virtual rows */}
                  {virtualRows.map((virtualRow) => {
                    const row = rows[virtualRow.index]
                    return (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                        data-index={virtualRow.index}
                        ref={(node) => rowVirtualizer.measureElement(node)}
                        onClick={() => onRowClick?.(row.original)}
                        className={onRowClick ? 'cursor-pointer' : ''}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })}

                  {/* Bottom padding */}
                  {paddingBottom > 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        style={{ height: `${paddingBottom}px` }}
                      />
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <span>
              {table.getFilteredSelectedRowModel().rows.length} of{' '}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {virtualRows.length} of {rows.length} rows
        </div>
      </div>
    </div>
  )
}
