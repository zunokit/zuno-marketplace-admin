/**
 * Schema Types
 * Type definitions for database schema management
 * Re-exports common types from api.types and domain.types to avoid duplication
 */

import type {
  TableMetadata,
  TableConstraint,
  TableIndex,
  TableDependency,
  DatabaseStatistics,
} from './domain.types'

import type {
  ColumnInfo,
  SchemaRelationship,
  TableSchemaInfo,
} from './api.types'

// Re-export types from other modules for convenience
export type {
  ColumnInfo,
  TableMetadata,
  TableConstraint,
  TableIndex,
  TableDependency,
  DatabaseStatistics,
  SchemaRelationship,
  TableSchemaInfo,
}

// Schema-specific types (not duplicated elsewhere)
export interface CompleteSchemaInfo {
  tables: TableSchemaInfo[]
  relationships: SchemaRelationship[]
}
