/**
 * Database introspection utilities
 * Provides functions to query database structure and data
 */

import { sql } from 'drizzle-orm'
import { getProjectDb } from '@/lib/infrastructure/database/connections/project-connections'
import { errorHandler } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'

interface TableInfo {
  tableName: string
  schemaName: string
  rowCount: number
}

interface ColumnInfo {
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

interface TableData {
  rows: Record<string, unknown>[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}

export interface TableMetadata {
  tableName: string
  schemaName: string
  tableSize: string
  indexesSize: string
  totalSize: string
  rowCountEstimate: number
  lastVacuum: Date | null
  lastAnalyze: Date | null
  lastAutoVacuum: Date | null
  lastAutoAnalyze: Date | null
  toastSize: string | null
  hasToastTable: boolean
}

export interface TableConstraint {
  constraintName: string
  constraintType: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK'
  columnNames: string[]
  definition: string
  referencedTable: string | null
  referencedColumns: string[] | null
  updateRule: string | null
  deleteRule: string | null
}

export interface TableIndex {
  indexName: string
  indexType: string
  columnNames: string[]
  isUnique: boolean
  isPrimary: boolean
  indexSize: string
  indexDef: string
  tablespace: string | null
}

export interface TableDependency {
  tableName: string
  schemaName: string
  dependencyType: 'referenced_by' | 'references'
  constraintName: string
  foreignKeyColumns: string[]
  referencedColumns: string[]
  updateRule: string
  deleteRule: string
}

export interface DatabaseStatistics {
  totalSize: string
  totalSizeBytes: number
  largestTables: Array<{
    tableName: string
    schemaName: string
    tableSize: string
    indexesSize: string
    totalSize: string
    rowCountEstimate: number
    tableSizeBytes: number
  }>
  totalTables: number
  totalIndexes: number
  totalRowsEstimate: number
  dataToIndexRatio: number
}

/**
 * Get all tables in a project database
 */
export async function getProjectTables(projectId: string): Promise<TableInfo[]> {
  return errorHandler(async () => {
    const db = await getProjectDb(projectId)

    const result = await db.execute<{ table_name: string; schema_name: string }>(sql`
      SELECT
        table_name,
        table_schema as schema_name
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      AND table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name
    `)

    // Get row counts for each table
    const tablesWithCounts = await Promise.all(
      result.map(async (table) => {
        try {
          const countResult = await db.execute<{ count: number }>(
            sql.raw(`SELECT COUNT(*) as count FROM "${table.schema_name}"."${table.table_name}"`)
          )
          return {
            tableName: table.table_name,
            schemaName: table.schema_name,
            rowCount: Number(countResult[0]?.count || 0),
          }
        } catch {
          // If count fails, return 0
          return {
            tableName: table.table_name,
            schemaName: table.schema_name,
            rowCount: 0,
          }
        }
      })
    )

    logger.debug('Retrieved project tables', { projectId, count: tablesWithCounts.length })

    return tablesWithCounts
  }, 'getProjectTables')
}

/**
 * Get schema information for a specific table
 */
export async function getTableSchema(projectId: string, tableName: string): Promise<ColumnInfo[]> {
  return errorHandler(async () => {
    const db = await getProjectDb(projectId)

    // Get column information with primary keys and foreign keys
    const result = await db.execute<{
      column_name: string
      data_type: string
      is_nullable: string
      column_default: string | null
      is_primary: boolean
      is_foreign_key: boolean
      foreign_table: string | null
      foreign_column: string | null
      udt_name: string
    }>(sql`
      SELECT
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.udt_name,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary,
        CASE WHEN fk.column_name IS NOT NULL THEN true ELSE false END as is_foreign_key,
        fk.foreign_table_name as foreign_table,
        fk.foreign_column_name as foreign_column
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name
          AND tc.table_schema = ku.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND ku.table_name = ${tableName}
      ) pk ON c.column_name = pk.column_name
      LEFT JOIN (
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND kcu.table_name = ${tableName}
      ) fk ON c.column_name = fk.column_name
      WHERE c.table_name = ${tableName}
      ORDER BY c.ordinal_position
    `)

    // Get enum values for enum types
    const schema = await Promise.all(
      result.map(async (col) => {
        let enumValues: string[] | null = null

        // Check if it's an enum type (USER-DEFINED type)
        if (col.data_type === 'USER-DEFINED' && col.udt_name) {
          try {
            const enumResult = await db.execute<{ enum_value: string }>(sql`
              SELECT e.enumlabel as enum_value
              FROM pg_type t
              JOIN pg_enum e ON t.oid = e.enumtypid
              WHERE t.typname = ${col.udt_name}
              ORDER BY e.enumsortorder
            `)
            enumValues = enumResult.map((e) => e.enum_value)
          } catch {
            // If enum query fails, continue without enum values
            enumValues = null
          }
        }

        return {
          columnName: col.column_name,
          dataType: col.data_type === 'USER-DEFINED' ? col.udt_name : col.data_type,
          isNullable: col.is_nullable === 'YES',
          defaultValue: col.column_default,
          isPrimaryKey: col.is_primary,
          isForeignKey: col.is_foreign_key,
          foreignKeyTable: col.foreign_table,
          foreignKeyColumn: col.foreign_column,
          enumValues,
        }
      })
    )

    logger.debug('Retrieved table schema', { projectId, tableName, columnCount: schema.length })

    return schema
  }, 'getTableSchema')
}

/**
 * Get data from a table with pagination and search
 */
export async function getTableData(
  projectId: string,
  tableName: string,
  options?: {
    page?: number
    limit?: number
    orderBy?: string
    orderDirection?: 'asc' | 'desc'
    search?: string
    searchColumns?: string[]
  }
): Promise<TableData> {
  return errorHandler(async () => {
    const db = await getProjectDb(projectId)

    const page = options?.page || 1
    const limit = options?.limit || 50
    const offset = (page - 1) * limit
    const orderBy = options?.orderBy || 'id'
    const orderDirection = options?.orderDirection || 'desc'

    // Build WHERE clause for search
    let whereClause = ''
    if (options?.search && options?.searchColumns && options.searchColumns.length > 0) {
      const searchConditions = options.searchColumns.map((col) => {
        return `CAST("${col}" AS TEXT) ILIKE '%${options.search}%'`
      })
      whereClause = `WHERE ${searchConditions.join(' OR ')}`
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM "${tableName}" ${whereClause}`
    const countResult = await db.execute<{ count: string }>(sql.raw(countQuery))
    const totalCount = Number(countResult[0]?.count || 0)

    // Get data
    const dataQuery = `
      SELECT * FROM "${tableName}"
      ${whereClause}
      ORDER BY "${orderBy}" ${orderDirection}
      LIMIT ${limit} OFFSET ${offset}
    `
    const rows = await db.execute<Record<string, unknown>>(sql.raw(dataQuery))

    const totalPages = Math.ceil(totalCount / limit)

    logger.debug('Retrieved table data', {
      projectId,
      tableName,
      page,
      limit,
      totalCount,
      rowCount: rows.length,
    })

    return {
      rows,
      totalCount,
      page,
      limit,
      totalPages,
    }
  }, 'getTableData')
}

/**
 * Get detailed metadata for a specific table
 * Includes size statistics, vacuum/analyze timestamps, and TOAST table info
 */
export async function getTableMetadata(projectId: string, tableName: string): Promise<TableMetadata> {
  return errorHandler(async () => {
    const db = await getProjectDb(projectId)

    const result = await db.execute<{
      table_name: string
      schema_name: string
      table_size: string
      indexes_size: string
      total_size: string
      row_count_estimate: string
      last_vacuum: Date | null
      last_analyze: Date | null
      last_autovacuum: Date | null
      last_autoanalyze: Date | null
      toast_size: string | null
      has_toast_table: boolean
    }>(sql`
      SELECT
        c.relname AS table_name,
        n.nspname AS schema_name,
        pg_size_pretty(pg_table_size(c.oid)) AS table_size,
        pg_size_pretty(pg_indexes_size(c.oid)) AS indexes_size,
        pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
        c.reltuples::bigint AS row_count_estimate,
        pg_stat_get_last_vacuum_time(c.oid) AS last_vacuum,
        pg_stat_get_last_analyze_time(c.oid) AS last_analyze,
        pg_stat_get_last_autovacuum_time(c.oid) AS last_autovacuum,
        pg_stat_get_last_autoanalyze_time(c.oid) AS last_autoanalyze,
        CASE
          WHEN c.reltoastrelid > 0 THEN pg_size_pretty(pg_total_relation_size(c.reltoastrelid))
          ELSE NULL
        END AS toast_size,
        c.reltoastrelid > 0 AS has_toast_table
      FROM pg_class c
      LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = ${tableName}
        AND n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND c.relkind = 'r'
    `)

    if (!result || result.length === 0) {
      throw new Error(`Table ${tableName} not found`)
    }

    const row = result[0]

    logger.debug('Retrieved table metadata', {
      projectId,
      tableName,
      totalSize: row.total_size,
      rowCount: row.row_count_estimate,
    })

    return {
      tableName: row.table_name,
      schemaName: row.schema_name,
      tableSize: row.table_size,
      indexesSize: row.indexes_size,
      totalSize: row.total_size,
      rowCountEstimate: Number(row.row_count_estimate),
      lastVacuum: row.last_vacuum,
      lastAnalyze: row.last_analyze,
      lastAutoVacuum: row.last_autovacuum,
      lastAutoAnalyze: row.last_autoanalyze,
      toastSize: row.toast_size,
      hasToastTable: row.has_toast_table,
    }
  }, 'getTableMetadata')
}

/**
 * Get all constraints for a specific table
 * Includes PRIMARY KEY, FOREIGN KEY, UNIQUE, and CHECK constraints
 */
export async function getTableConstraints(
  projectId: string,
  tableName: string
): Promise<TableConstraint[]> {
  return errorHandler(async () => {
    const db = await getProjectDb(projectId)

    const result = await db.execute<{
      constraint_name: string
      constraint_type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK'
      column_names: string
      definition: string
      referenced_table: string | null
      referenced_columns: string | null
      update_rule: string | null
      delete_rule: string | null
    }>(sql`
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        string_agg(DISTINCT kcu.column_name, ', ' ORDER BY kcu.column_name) AS column_names,
        pg_get_constraintdef(pgc.oid) AS definition,
        ccu.table_name AS referenced_table,
        string_agg(DISTINCT ccu.column_name, ', ' ORDER BY ccu.column_name) AS referenced_columns,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
      LEFT JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
        AND tc.table_schema = rc.constraint_schema
      LEFT JOIN pg_constraint pgc
        ON pgc.conname = tc.constraint_name
      WHERE tc.table_name = ${tableName}
        AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
      GROUP BY
        tc.constraint_name,
        tc.constraint_type,
        ccu.table_name,
        rc.update_rule,
        rc.delete_rule,
        pgc.oid
      ORDER BY
        CASE tc.constraint_type
          WHEN 'PRIMARY KEY' THEN 1
          WHEN 'FOREIGN KEY' THEN 2
          WHEN 'UNIQUE' THEN 3
          WHEN 'CHECK' THEN 4
        END,
        tc.constraint_name
    `)

    logger.debug('Retrieved table constraints', {
      projectId,
      tableName,
      constraintCount: result.length,
    })

    return result.map((row) => ({
      constraintName: row.constraint_name,
      constraintType: row.constraint_type,
      columnNames: row.column_names ? row.column_names.split(', ') : [],
      definition: row.definition,
      referencedTable: row.referenced_table,
      referencedColumns: row.referenced_columns ? row.referenced_columns.split(', ') : null,
      updateRule: row.update_rule,
      deleteRule: row.delete_rule,
    }))
  }, 'getTableConstraints')
}

/**
 * Get all indexes for a specific table
 * Includes index type, columns, size, and definition
 */
export async function getTableIndexes(projectId: string, tableName: string): Promise<TableIndex[]> {
  return errorHandler(async () => {
    const db = await getProjectDb(projectId)

    const result = await db.execute<{
      index_name: string
      index_type: string
      column_names: string
      is_unique: boolean
      is_primary: boolean
      index_size: string
      index_def: string
      tablespace: string | null
    }>(sql`
      SELECT
        i.relname AS index_name,
        am.amname AS index_type,
        string_agg(a.attname, ', ' ORDER BY array_position(ix.indkey, a.attnum)) AS column_names,
        ix.indisunique AS is_unique,
        ix.indisprimary AS is_primary,
        pg_size_pretty(pg_relation_size(i.oid)) AS index_size,
        pg_get_indexdef(i.oid) AS index_def,
        ts.spcname AS tablespace
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_am am ON i.relam = am.oid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      LEFT JOIN pg_tablespace ts ON ts.oid = i.reltablespace
      CROSS JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS u(attnum, ord)
      LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = u.attnum
      WHERE t.relname = ${tableName}
        AND n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND t.relkind = 'r'
      GROUP BY
        i.relname,
        am.amname,
        ix.indisunique,
        ix.indisprimary,
        i.oid,
        ts.spcname,
        ix.indkey
      ORDER BY
        ix.indisprimary DESC,
        ix.indisunique DESC,
        i.relname
    `)

    logger.debug('Retrieved table indexes', {
      projectId,
      tableName,
      indexCount: result.length,
    })

    return result.map((row) => ({
      indexName: row.index_name,
      indexType: row.index_type,
      columnNames: row.column_names ? row.column_names.split(', ') : [],
      isUnique: row.is_unique,
      isPrimary: row.is_primary,
      indexSize: row.index_size,
      indexDef: row.index_def,
      tablespace: row.tablespace,
    }))
  }, 'getTableIndexes')
}

/**
 * Get table dependencies (foreign key relationships)
 * Shows both tables that depend on this table and tables this table depends on
 */
export async function getTableDependencies(
  projectId: string,
  tableName: string
): Promise<TableDependency[]> {
  return errorHandler(async () => {
    const db = await getProjectDb(projectId)

    // Get tables that reference this table (dependent tables)
    const referencedBy = await db.execute<{
      table_name: string
      schema_name: string
      constraint_name: string
      foreign_key_columns: string
      referenced_columns: string
      update_rule: string
      delete_rule: string
    }>(sql`
      SELECT
        tc.table_name,
        tc.table_schema AS schema_name,
        tc.constraint_name,
        string_agg(DISTINCT kcu.column_name, ', ' ORDER BY kcu.column_name) AS foreign_key_columns,
        string_agg(DISTINCT ccu.column_name, ', ' ORDER BY ccu.column_name) AS referenced_columns,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
        AND tc.table_schema = rc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = ${tableName}
        AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
      GROUP BY
        tc.table_name,
        tc.table_schema,
        tc.constraint_name,
        rc.update_rule,
        rc.delete_rule
      ORDER BY tc.table_name
    `)

    // Get tables this table references (dependencies)
    const references = await db.execute<{
      table_name: string
      schema_name: string
      constraint_name: string
      foreign_key_columns: string
      referenced_columns: string
      update_rule: string
      delete_rule: string
    }>(sql`
      SELECT
        ccu.table_name,
        ccu.table_schema AS schema_name,
        tc.constraint_name,
        string_agg(DISTINCT kcu.column_name, ', ' ORDER BY kcu.column_name) AS foreign_key_columns,
        string_agg(DISTINCT ccu.column_name, ', ' ORDER BY ccu.column_name) AS referenced_columns,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
        AND tc.table_schema = rc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = ${tableName}
        AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
      GROUP BY
        ccu.table_name,
        ccu.table_schema,
        tc.constraint_name,
        rc.update_rule,
        rc.delete_rule
      ORDER BY ccu.table_name
    `)

    const dependencies: TableDependency[] = [
      ...referencedBy.map((row) => ({
        tableName: row.table_name,
        schemaName: row.schema_name,
        dependencyType: 'referenced_by' as const,
        constraintName: row.constraint_name,
        foreignKeyColumns: row.foreign_key_columns ? row.foreign_key_columns.split(', ') : [],
        referencedColumns: row.referenced_columns ? row.referenced_columns.split(', ') : [],
        updateRule: row.update_rule,
        deleteRule: row.delete_rule,
      })),
      ...references.map((row) => ({
        tableName: row.table_name,
        schemaName: row.schema_name,
        dependencyType: 'references' as const,
        constraintName: row.constraint_name,
        foreignKeyColumns: row.foreign_key_columns ? row.foreign_key_columns.split(', ') : [],
        referencedColumns: row.referenced_columns ? row.referenced_columns.split(', ') : [],
        updateRule: row.update_rule,
        deleteRule: row.delete_rule,
      })),
    ]

    logger.debug('Retrieved table dependencies', {
      projectId,
      tableName,
      referencedByCount: referencedBy.length,
      referencesCount: references.length,
    })

    return dependencies
  }, 'getTableDependencies')
}

/**
 * Get database-wide statistics
 * Includes total size, largest tables, and index/data ratios
 */
export async function getDatabaseStatistics(projectId: string): Promise<DatabaseStatistics> {
  return errorHandler(async () => {
    const db = await getProjectDb(projectId)

    // Get total database size
    const sizeResult = await db.execute<{
      total_size: string
      total_size_bytes: string
    }>(sql`
      SELECT
        pg_size_pretty(pg_database_size(current_database())) AS total_size,
        pg_database_size(current_database())::bigint AS total_size_bytes
    `)

    const totalSize = sizeResult[0]?.total_size || '0 bytes'
    const totalSizeBytes = Number(sizeResult[0]?.total_size_bytes || 0)

    // Get largest tables with detailed size information
    const largestTablesResult = await db.execute<{
      table_name: string
      schema_name: string
      table_size: string
      indexes_size: string
      total_size: string
      row_count_estimate: string
      table_size_bytes: string
    }>(sql`
      SELECT
        c.relname AS table_name,
        n.nspname AS schema_name,
        pg_size_pretty(pg_table_size(c.oid)) AS table_size,
        pg_size_pretty(pg_indexes_size(c.oid)) AS indexes_size,
        pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
        c.reltuples::bigint AS row_count_estimate,
        pg_total_relation_size(c.oid)::bigint AS table_size_bytes
      FROM pg_class c
      LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND c.relkind = 'r'
      ORDER BY pg_total_relation_size(c.oid) DESC
      LIMIT 10
    `)

    // Get total counts
    const countsResult = await db.execute<{
      total_tables: string
      total_indexes: string
      total_rows_estimate: string
    }>(sql`
      SELECT
        COUNT(DISTINCT c.relname)::bigint AS total_tables,
        (
          SELECT COUNT(*)::bigint
          FROM pg_class ic
          LEFT JOIN pg_namespace in_n ON in_n.oid = ic.relnamespace
          WHERE in_n.nspname NOT IN ('pg_catalog', 'information_schema')
            AND ic.relkind = 'i'
        ) AS total_indexes,
        SUM(c.reltuples)::bigint AS total_rows_estimate
      FROM pg_class c
      LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND c.relkind = 'r'
    `)

    const counts = countsResult[0] || {
      total_tables: '0',
      total_indexes: '0',
      total_rows_estimate: '0',
    }

    // Calculate data to index ratio
    const dataIndexRatioResult = await db.execute<{
      data_size: string
      index_size: string
    }>(sql`
      SELECT
        SUM(pg_table_size(c.oid))::bigint AS data_size,
        SUM(pg_indexes_size(c.oid))::bigint AS index_size
      FROM pg_class c
      LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND c.relkind = 'r'
    `)

    const dataSize = Number(dataIndexRatioResult[0]?.data_size || 0)
    const indexSize = Number(dataIndexRatioResult[0]?.index_size || 0)
    const dataToIndexRatio = dataSize > 0 ? indexSize / dataSize : 0

    logger.info('Retrieved database statistics', {
      projectId,
      totalSize,
      totalTables: counts.total_tables,
      totalIndexes: counts.total_indexes,
      dataToIndexRatio: dataToIndexRatio.toFixed(2),
    })

    return {
      totalSize,
      totalSizeBytes,
      largestTables: largestTablesResult.map((row) => ({
        tableName: row.table_name,
        schemaName: row.schema_name,
        tableSize: row.table_size,
        indexesSize: row.indexes_size,
        totalSize: row.total_size,
        rowCountEstimate: Number(row.row_count_estimate),
        tableSizeBytes: Number(row.table_size_bytes),
      })),
      totalTables: Number(counts.total_tables),
      totalIndexes: Number(counts.total_indexes),
      totalRowsEstimate: Number(counts.total_rows_estimate),
      dataToIndexRatio,
    }
  }, 'getDatabaseStatistics')
}
