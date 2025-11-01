/**
 * Database Introspection System
 * Auto-discovers tables and schemas from project databases
 */

import { sql } from 'drizzle-orm'
import type { ProjectId } from '@/config/projects.config'
import { getProjectDb } from './connections'
import { errorHandler } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'

export interface TableInfo {
  name: string
  schema: string
  rowCount: number
}

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  defaultValue: string | null
  isPrimaryKey: boolean
  isForeignKey: boolean
  foreignKeyTable: string | null
  foreignKeyColumn: string | null
}

export interface TableSchema {
  tableName: string
  schema: string
  columns: ColumnInfo[]
  primaryKeys: string[]
  foreignKeys: Array<{
    column: string
    referencedTable: string
    referencedColumn: string
  }>
}

/**
 * Get all tables in a project database
 */
export async function getProjectTables(projectId: ProjectId): Promise<TableInfo[]> {
  return errorHandler(async () => {
    const db = getProjectDb(projectId)

    const result = await db.execute<{
      table_name: string
      table_schema: string
      row_count: number
    }>(sql`
      SELECT
        t.table_name,
        t.table_schema,
        COALESCE(s.n_live_tup, 0) as row_count
      FROM information_schema.tables t
      LEFT JOIN pg_stat_user_tables s ON t.table_name = s.relname
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    `)

    logger.info(`Discovered ${result.length} tables in project: ${projectId}`)

    return result.map((row) => ({
      name: row.table_name,
      schema: row.table_schema,
      rowCount: Number(row.row_count) || 0,
    }))
  }, 'getProjectTables')
}

/**
 * Get table schema with column information
 */
export async function getTableSchema(
  projectId: ProjectId,
  tableName: string
): Promise<TableSchema> {
  return errorHandler(async () => {
    const db = getProjectDb(projectId)

    // Get column information
    const columns = await db.execute<{
      column_name: string
      data_type: string
      is_nullable: string
      column_default: string | null
    }>(sql`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
      ORDER BY ordinal_position
    `)

    // Get primary keys
    const primaryKeys = await db.execute<{
      column_name: string
    }>(sql`
      SELECT a.attname as column_name
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = ${tableName}::regclass
        AND i.indisprimary
    `)

    // Get foreign keys
    const foreignKeys = await db.execute<{
      column_name: string
      foreign_table_name: string
      foreign_column_name: string
    }>(sql`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = ${tableName}
    `)

    const pkSet = new Set(primaryKeys.map((pk) => pk.column_name))
    const fkMap = new Map(
      foreignKeys.map((fk) => [
        fk.column_name,
        { table: fk.foreign_table_name, column: fk.foreign_column_name },
      ])
    )

    const columnInfos: ColumnInfo[] = columns.map((col) => {
      const fk = fkMap.get(col.column_name)
      return {
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        defaultValue: col.column_default,
        isPrimaryKey: pkSet.has(col.column_name),
        isForeignKey: !!fk,
        foreignKeyTable: fk?.table || null,
        foreignKeyColumn: fk?.column || null,
      }
    })

    logger.debug(`Retrieved schema for table: ${tableName}`, {
      columnsCount: columnInfos.length,
      primaryKeysCount: primaryKeys.length,
      foreignKeysCount: foreignKeys.length,
    })

    return {
      tableName,
      schema: 'public',
      columns: columnInfos,
      primaryKeys: primaryKeys.map((pk) => pk.column_name),
      foreignKeys: foreignKeys.map((fk) => ({
        column: fk.column_name,
        referencedTable: fk.foreign_table_name,
        referencedColumn: fk.foreign_column_name,
      })),
    }
  }, 'getTableSchema')
}

/**
 * Get data from a table with pagination
 */
export async function getTableData<T extends Record<string, unknown> = Record<string, unknown>>(
  projectId: ProjectId,
  tableName: string,
  options: {
    page?: number
    limit?: number
    orderBy?: string
    orderDirection?: 'asc' | 'desc'
    search?: string
    searchColumns?: string[]
  } = {}
): Promise<{ data: T[]; total: number; page: number; limit: number }> {
  return errorHandler(async () => {
    const db = getProjectDb(projectId)
    const page = options.page || 1
    const limit = options.limit || 50
    const offset = (page - 1) * limit

    // Build WHERE clause for search
    let whereClause = ''
    if (options.search && options.searchColumns && options.searchColumns.length > 0) {
      const searchConditions = options.searchColumns
        .map((col) => `${col}::text ILIKE '%${options.search}%'`)
        .join(' OR ')
      whereClause = `WHERE ${searchConditions}`
    }

    // Build ORDER BY clause
    const orderClause = options.orderBy
      ? `ORDER BY ${options.orderBy} ${options.orderDirection || 'asc'}`
      : ''

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`
    const countResult = await db.execute<{ count: string }>(sql.raw(countQuery))
    const total = Number(countResult[0]?.count || 0)

    // Get data
    const dataQuery = `SELECT * FROM ${tableName} ${whereClause} ${orderClause} LIMIT ${limit} OFFSET ${offset}`
    const data = await db.execute<T>(sql.raw(dataQuery))

    logger.debug(`Retrieved table data: ${tableName}`, {
      page,
      limit,
      total,
      returned: data.length,
    })

    return {
      data: data as T[],
      total,
      page,
      limit,
    }
  }, 'getTableData')
}
