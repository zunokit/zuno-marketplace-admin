/**
 * UI Component Prop Types
 * Types for component props and UI-specific interfaces
 */

import type { ColumnDef } from '@tanstack/react-table'
import type { LucideIcon } from 'lucide-react'

// ============================================================================
// Project UI Types
// ============================================================================

export interface UIProject {
  id: string
  name: string
  slug: string
  projectType: string | null
  description: string | null
  isActive: boolean
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
  status: string
  databaseUrl: string | null
  icon: string | null
  color: string | null
  logo: string | null
}

// ============================================================================
// Data Table Types
// ============================================================================

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  isLoading?: boolean
  emptyMessage?: string
  onRowClick?: (row: TData) => void
}

export interface DataTableToolbarProps {
  table: unknown // TanStack Table instance
  searchPlaceholder?: string
  filterColumns?: string[]
}

export interface DataTableColumnHeaderProps {
  column: unknown // TanStack Column instance
  title: string
  className?: string
}

export interface RowAction<TData> {
  label: string
  icon?: React.ReactNode
  onClick: (row: TData) => void
  variant?: 'default' | 'destructive'
  separator?: boolean
  disabled?: (row: TData) => boolean
}

export interface DataTableRowActionsProps<TData> {
  row: unknown // TanStack Row instance
  actions: RowAction<TData>[]
}

// ============================================================================
// Form Types
// ============================================================================

export interface FieldSchema {
  name: string
  type: string
  nullable: boolean
  defaultValue: string | null
  isPrimaryKey: boolean
  isForeignKey: boolean
  foreignKeyTable: string | null
  foreignKeyColumn: string | null
  enumValues: string[] | null
}

export interface DynamicFormProps {
  schema: FieldSchema[]
  initialData?: Record<string, unknown>
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
  excludeFields?: string[]
}

export interface ForeignKeySelectProps {
  projectId: string
  tableName: string
  valueColumn: string
  labelColumn: string
  value: unknown
  onChange: (value: unknown) => void
  disabled?: boolean
  placeholder?: string
}

// ============================================================================
// Dialog Types
// ============================================================================

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export interface CreateRecordDialogProps extends DialogProps {
  projectId: string
  tableName: string
  schema: FieldSchema[]
}

export interface EditRecordDialogProps extends DialogProps {
  projectId: string
  tableName: string
  schema: FieldSchema[]
  record: Record<string, unknown>
  primaryKey: string
}

export interface DeleteRecordDialogProps extends DialogProps {
  projectId: string
  tableName: string
  primaryKey: string
  primaryKeyValue: string | number
}

// ============================================================================
// Navigation Types
// ============================================================================

export interface NavigationItem {
  label: string
  href: string
  icon?: LucideIcon
  permission?: string
  badge?: string | number
  isActive?: boolean
}

export interface NavigationSection {
  title?: string
  items: NavigationItem[]
}

export interface SidebarProps {
  sections: NavigationSection[]
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

// ============================================================================
// Project Switcher Types
// ============================================================================

export interface ProjectSwitcherProject {
  id: string
  name: string
  slug: string
  role: string
}

export interface ProjectSwitcherProps {
  projects: ProjectSwitcherProject[]
  activeProjectId: string | null
  onProjectChange: (projectId: string) => void
  onCreateProject: () => void
}

// ============================================================================
// User Menu Types
// ============================================================================

export interface UserMenuProps {
  user: {
    name: string
    email: string
    image: string | null
    role: string
  }
  onSignOut: () => void
  onProfile: () => void
  onSettings: () => void
}

// ============================================================================
// Schema Visualization Types
// ============================================================================

export interface TableNode {
  id: string
  name: string
  columns: Array<{
    name: string
    type: string
    isPrimaryKey: boolean
    isForeignKey: boolean
  }>
  position: { x: number; y: number }
}

export interface RelationshipEdge {
  id: string
  source: string
  target: string
  sourceColumn: string
  targetColumn: string
  relationshipType: 'one-to-many' | 'many-to-one' | 'one-to-one'
}

export interface SchemaVisualizationProps {
  tables: TableNode[]
  relationships: RelationshipEdge[]
  onTableClick?: (tableId: string) => void
  onRelationshipClick?: (relationshipId: string) => void
}

// ============================================================================
// Loading & Error States
// ============================================================================

export interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export interface ErrorStateProps {
  title?: string
  message: string
  retry?: () => void
  reset?: () => void
}

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}
