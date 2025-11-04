/**
 * API Request and Response Types
 * Centralized types for all API contracts
 */

import type { ProjectRole, ProjectPermission } from './domain.types'

// ============================================================================
// Generic API Types
// ============================================================================

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// ============================================================================
// Project API Types
// ============================================================================

export interface CreateProjectRequest {
  name: string
  description?: string
  databaseUrl?: string
  slug?: string
}

export interface CreateProjectResponse {
  id: string
  name: string
  description: string | null
  slug: string
  databaseUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UpdateProjectRequest {
  id: string
  name?: string
  description?: string
  databaseUrl?: string
  slug?: string
}

export interface UpdateProjectResponse extends CreateProjectResponse {}

export interface ProjectListItem {
  id: string
  name: string
  description: string | null
  slug: string
  memberCount: number
  role: ProjectRole
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Member API Types
// ============================================================================

export interface InviteMemberRequest {
  projectId: string
  email: string
  role: ProjectRole
}

export interface InviteMemberResponse {
  invitationId: string
  email: string
  role: ProjectRole
  expiresAt: Date
}

export interface UpdateMemberRoleRequest {
  projectId: string
  userId: string
  role: ProjectRole
}

export interface RemoveMemberRequest {
  projectId: string
  userId: string
}

export interface MemberListItem {
  id: string
  userId: string
  projectId: string
  role: ProjectRole
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Data Management API Types
// ============================================================================

export interface TableInfo {
  name: string
  schema: string
  rowCount: number
}

export interface ColumnInfo {
  columnName: string
  dataType: string
  isNullable: boolean
  defaultValue: string | null
  isPrimaryKey: boolean
  isForeignKey: boolean
  foreignKeyTable: string | null
  foreignKeyColumn: string | null
  enumValues: string[] | null
}

export interface TableDataRequest {
  projectId: string
  tableName: string
  page?: number
  limit?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  search?: string
  searchColumns?: string[]
}

export interface TableDataResponse {
  rows: Record<string, unknown>[]
  total: number
  page: number
  limit: number
}

export interface CreateRecordRequest {
  projectId: string
  tableName: string
  data: Record<string, unknown>
}

export interface UpdateRecordRequest {
  projectId: string
  tableName: string
  primaryKeyColumn: string
  primaryKeyValue: unknown
  data: Record<string, unknown>
}

export interface DeleteRecordRequest {
  projectId: string
  tableName: string
  primaryKeyColumn: string
  primaryKeyValue: unknown
}

export interface BulkDeleteRecordsRequest {
  projectId: string
  tableName: string
  primaryKeyColumn: string
  primaryKeyValues: unknown[]
}

// ============================================================================
// Schema API Types
// ============================================================================

export interface TableMetadataResponse {
  tableName: string
  schemaName: string
  tableSize: string
  indexSize: string
  totalSize: string
  rowCountEstimate: number
  lastVacuum: Date | null
  lastAnalyze: Date | null
  toastTableName: string | null
  toastTableSize: string | null
}

export interface TableConstraintResponse {
  constraintName: string
  constraintType: string
  definition: string
  columns: string[]
}

export interface TableIndexResponse {
  indexName: string
  indexType: string
  columns: string[]
  isUnique: boolean
  isPrimary: boolean
  indexSize: string
  indexDef: string
}

export interface TableDependencyResponse {
  dependencyType: 'references' | 'referenced_by'
  tableName: string
  columnName: string
  foreignTableName: string
  foreignColumnName: string
  constraintName: string
}

export interface DatabaseStatisticsResponse {
  totalSize: string
  dataSize: string
  indexSize: string
  totalTables: number
  totalIndexes: number
  dataToIndexRatio: number
  largestTables: Array<{
    tableName: string
    totalSize: string
    rowCountEstimate: number
  }>
  largestIndexes: Array<{
    indexName: string
    tableName: string
    indexSize: string
  }>
}

export interface SchemaRelationship {
  sourceTable: string
  sourceColumn: string
  targetTable: string
  targetColumn: string
  relationshipType: 'one-to-many' | 'many-to-one' | 'one-to-one'
}

export interface TableSchemaInfo {
  tableName: string
  schemaName: string
  rowCount: number
  columns: ColumnInfo[]
}

export interface CompleteSchemaResponse {
  tables: TableSchemaInfo[]
  relationships: SchemaRelationship[]
}

// ============================================================================
// Query API Types
// ============================================================================

export interface ExecuteQueryRequest {
  projectId: string
  query: string
}

export interface ExecuteQueryResponse {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  executionTime: number
}
