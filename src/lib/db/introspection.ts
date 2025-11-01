/**
 * Database introspection utilities
 * Provides functions to query database structure and data
 */

import { sql } from 'drizzle-orm'
import { getProjectDb } from './connections'
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
