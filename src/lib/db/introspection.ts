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

    const result = await db.execute<{
      column_name: string
      data_type: string
      is_nullable: string
      column_default: string | null
      is_primary: boolean
    }>(sql`
      SELECT
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary
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
      WHERE c.table_name = ${tableName}
      ORDER BY c.ordinal_position
    `)

    const schema = result.map((col) => ({
      columnName: col.column_name,
      dataType: col.data_type,
      isNullable: col.is_nullable === 'YES',
      defaultValue: col.column_default,
      isPrimaryKey: col.is_primary,
    }))

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
