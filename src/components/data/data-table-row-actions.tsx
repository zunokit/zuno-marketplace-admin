'use client'

/**
 * Row Actions Component
 * Provides a dropdown menu for common table row actions
 */

import { Row } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { RowAction } from '@/types/ui.types'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  actions: RowAction<TData>[]
}

export function DataTableRowActions<TData>({
  row,
  actions,
}: DataTableRowActionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {actions.map((action, index) => {
          const isDisabled = action.disabled ? action.disabled(row.original) : false
          return (
            <div key={index}>
              {action.separator && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => !isDisabled && action.onClick(row.original)}
                disabled={isDisabled}
                className={
                  action.variant === 'destructive'
                    ? 'text-destructive focus:text-destructive'
                    : ''
                }
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </DropdownMenuItem>
            </div>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
