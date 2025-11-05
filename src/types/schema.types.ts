/**
 * Schema Types
 * Type definitions for database schema management
 */

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

export interface TableSchemaInfo {
  tableName: string
  schemaName: string
  rowCount: number
  columns: ColumnInfo[]
}

export interface SchemaRelationship {
  sourceTable: string
  sourceColumn: string
  targetTable: string
  targetColumn: string
  relationshipType: 'one-to-many' | 'many-to-one' | 'one-to-one'
}

export interface CompleteSchemaInfo {
  tables: TableSchemaInfo[]
  relationships: SchemaRelationship[]
}

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
  constraintType: string
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
