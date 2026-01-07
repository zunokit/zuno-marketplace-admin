/**
 * Type Definitions for Schema Explorer
 * Used by Schema Explorer UI components
 */

export type ConstraintType = 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK'

export type Constraint = {
  constraintName: string
  constraintType: ConstraintType
  columnNames: string[]
  definition?: string
  referencedTable?: string
  referencedColumns?: string[]
}

export type Index = {
  indexName: string
  indexType: string
  columns: string[]
  isUnique: boolean
  isPrimary: boolean
  size?: string
}

export type TableDependency = {
  tableName: string
  dependencyType: 'references' | 'referenced_by'
  columnName: string
  foreignColumnName: string
}

export type TableStatistics = {
  tableName: string
  schemaName: string
  rowCount: number
  totalSize: string
  dataSize: string
  indexSize: string
  lastVacuum?: string
  lastAutoVacuum?: string
  lastAnalyze?: string
}

export type DatabaseStatistics = {
  totalSize: string
  totalTables: number
  totalIndexes: number
  totalRows: number
  largestTables: {
    tableName: string
    size: string
    rowCount: number
  }[]
  sizeBreakdown: {
    dataSize: string
    indexSize: string
    totalSize: string
  }
}

export type TableDetails = {
  tableName: string
  schemaName: string
  statistics: TableStatistics
  columns: {
    columnName: string
    dataType: string
    isNullable: boolean
    defaultValue: string | null
    isPrimaryKey: boolean
    isForeignKey: boolean
    foreignKeyTable: string | null
    foreignKeyColumn: string | null
    enumValues: string[] | null
  }[]
  constraints: Constraint[]
  indexes: Index[]
  dependencies: TableDependency[]
  ddl: string
}
