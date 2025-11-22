/**
 * Domain Entity Types
 * Core business domain types
 */

// ============================================================================
// User & Authentication Types
// ============================================================================

export type GlobalRole = 'super_admin' | 'user'

export interface User {
  id: string
  email: string
  name: string
  image: string | null
  emailVerified: boolean
  role: GlobalRole
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  user: {
    id: string
    email: string
    name: string
    image: string | null
    role: GlobalRole
  }
  session: {
    id: string
    expiresAt: Date
    token: string
    ipAddress: string | null
    userAgent: string | null
  }
}

// ============================================================================
// Project Types
// ============================================================================

export type ProjectRole = 'owner' | 'admin' | 'editor' | 'viewer'

export type ProjectPermission =
  | 'project.read'
  | 'project.update'
  | 'project.settings'
  | 'project.settings.read'
  | 'project.settings.update'
  | 'project.delete'
  | 'members.invite'
  | 'members.remove'
  | 'members.update_role'
  | 'data.create'
  | 'data.read'
  | 'data.update'
  | 'data.delete'

export interface Project {
  id: string
  name: string
  description: string | null
  slug: string
  databaseUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ProjectWithRole extends Project {
  role: ProjectRole
  memberCount: number
}

export interface ProjectMember {
  id: string
  userId: string
  projectId: string
  role: ProjectRole
  user: User
  createdAt: Date
  updatedAt: Date
}

export interface ProjectInvitation {
  id: string
  projectId: string
  email: string
  role: ProjectRole
  inviterId: string
  status: 'pending' | 'accepted' | 'expired'
  token: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Permission Types
// ============================================================================

export const ROLE_PERMISSIONS: Record<ProjectRole, ProjectPermission[]> = {
  owner: [
    'project.read',
    'project.update',
    'project.settings',
    'project.settings.read',
    'project.settings.update',
    'project.delete',
    'members.invite',
    'members.remove',
    'members.update_role',
    'data.create',
    'data.read',
    'data.update',
    'data.delete',
  ],
  admin: [
    'project.read',
    'project.update',
    'project.settings',
    'project.settings.read',
    'project.settings.update',
    'members.invite',
    'members.remove',
    'members.update_role',
    'data.create',
    'data.read',
    'data.update',
    'data.delete',
  ],
  editor: ['project.read', 'project.settings.read', 'data.create', 'data.read', 'data.update', 'data.delete'],
  viewer: ['project.read', 'project.settings.read', 'data.read'],
}

// ============================================================================
// Database Schema Types
// ============================================================================

export interface TableMetadata {
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

export interface TableConstraint {
  constraintName: string
  constraintType: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK'
  definition: string
  columns: string[]
}

export interface TableIndex {
  indexName: string
  indexType: string
  columns: string[]
  isUnique: boolean
  isPrimary: boolean
  indexSize: string
  indexDef: string
}

export interface TableDependency {
  dependencyType: 'references' | 'referenced_by'
  tableName: string
  columnName: string
  foreignTableName: string
  foreignColumnName: string
  constraintName: string
}

export interface DatabaseStatistics {
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

// ============================================================================
// Query Builder Types
// ============================================================================

export interface PrimaryKey {
  column: string
  value: unknown
}

export interface QueryOptions {
  page?: number
  limit?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  search?: string
  searchColumns?: string[]
}

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[]
  total: number
  page: number
  limit: number
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationIssue {
  field: string
  message: string
  code: string
}
