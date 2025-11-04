/**
 * Database-Related Types
 * Types for database schemas, records, and connections
 */

// ============================================================================
// Database Connection Types
// ============================================================================

export interface DatabaseConnectionConfig {
  projectId: string
  databaseUrl: string
  maxConnections?: number
  idleTimeout?: number
}

export interface ConnectionInfo {
  projectId: string
  connected: boolean
  lastChecked: Date
  error?: string
}

// ============================================================================
// Database Schema Types
// ============================================================================

export interface TableRecord {
  tablename: string
  schemaname: string
  tableowner: string
  tablespace: string | null
  hasindexes: boolean
  hasrules: boolean
  hastriggers: boolean
  rowsecurity: boolean
}

export interface ColumnRecord {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  character_maximum_length: number | null
  numeric_precision: number | null
  numeric_scale: number | null
  datetime_precision: number | null
  udt_name: string
}

export interface ConstraintRecord {
  constraint_name: string
  constraint_type: string
  table_name: string
  column_name: string | null
  foreign_table_name: string | null
  foreign_column_name: string | null
  check_clause: string | null
}

export interface IndexRecord {
  indexname: string
  indexdef: string
  tablespace: string | null
}

// ============================================================================
// Query Builder Types
// ============================================================================

export interface InsertParams {
  table: string
  data: Record<string, unknown>
  returning?: string[]
}

export interface UpdateParams {
  table: string
  data: Record<string, unknown>
  where: WhereClause
  returning?: string[]
}

export interface DeleteParams {
  table: string
  where: WhereClause
  returning?: string[]
}

export interface SelectParams {
  table: string
  columns?: string[]
  where?: WhereClause
  orderBy?: OrderByClause[]
  limit?: number
  offset?: number
  joins?: JoinClause[]
}

export interface WhereClause {
  column: string
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'NOT IN' | 'LIKE' | 'ILIKE'
  value: unknown
  logic?: 'AND' | 'OR'
}

export interface OrderByClause {
  column: string
  direction: 'ASC' | 'DESC'
}

export interface JoinClause {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'
  table: string
  on: {
    left: string
    right: string
  }
}

// ============================================================================
// Transaction Types
// ============================================================================

export interface TransactionContext {
  projectId: string
  userId: string
  operation: string
}

export interface TransactionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  rollback?: boolean
}

// ============================================================================
// Audit Log Types
// ============================================================================

export interface AuditLogEntry {
  id: string
  projectId: string
  userId: string
  action: string
  tableName: string | null
  recordId: string | null
  oldData: Record<string, unknown> | null
  newData: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

// ============================================================================
// Migration Types
// ============================================================================

export interface Migration {
  id: string
  name: string
  version: number
  appliedAt: Date
  checksum: string
}

export interface MigrationScript {
  version: number
  name: string
  up: string
  down: string
  checksum: string
}
