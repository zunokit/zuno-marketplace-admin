/**
 * Query Builder Service
 * Safe, parameterized SQL query builder for dynamic table operations
 * Never use raw SQL directly - always use this service
 */

import { sql } from 'drizzle-orm'
import { getProjectDb } from '@/lib/infrastructure/database/connections/project-connections'
import { ValidationError } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'
import type { PrimaryKey, QueryOptions, QueryResult } from '@/types/domain.types'

export class QueryBuilderService {
  /**
   * Validate table/column name to prevent SQL injection
   */
  private validateIdentifier(identifier: string, type: 'table' | 'column'): void {
    const validNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/

    if (!validNameRegex.test(identifier)) {
      throw new ValidationError(`Invalid ${type} name: ${identifier}`)
    }
  }

  /**
   * Escape string value for SQL
   */
  private escapeStringValue(value: string): string {
    return value.replace(/'/g, "''")
  }

  /**
   * Convert value to SQL string representation
   */
  private valueToSql(value: unknown): string {
    if (value === null || value === undefined) {
      return 'NULL'
    }

    if (typeof value === 'string') {
      return `'${this.escapeStringValue(value)}'`
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false'
    }

    if (typeof value === 'number') {
      return String(value)
    }

    if (typeof value === 'object') {
      const jsonStr = JSON.stringify(value)
      return `'${this.escapeStringValue(jsonStr)}'::jsonb`
    }

    return String(value)
  }

  /**
   * Insert a record into a table
   */
  async insert(
    projectId: string,
    tableName: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    try {
      // Validate inputs
      this.validateIdentifier(tableName, 'table')

      if (!data || Object.keys(data).length === 0) {
        throw new ValidationError('No data provided for insert')
      }

      // Validate all column names
      const columns = Object.keys(data)
      for (const col of columns) {
        this.validateIdentifier(col, 'column')
      }

      // Build INSERT query with parameterization
      const columnsList = columns.map((c) => `"${c}"`).join(', ')
      const valuesList = columns.map((col) => this.valueToSql(data[col])).join(', ')

      const query = sql.raw(
        `INSERT INTO "${tableName}" (${columnsList}) VALUES (${valuesList}) RETURNING *`
      )

      const db = await getProjectDb(projectId)
      const result = await db.execute<Record<string, unknown>>(query)

      if (!result || result.length === 0) {
        throw new ValidationError('Insert operation failed')
      }

      logger.info(`Inserted record into ${tableName}`, {
        projectId,
        tableName,
        columns,
      })

      return result[0]
    } catch (error) {
      logger.error(`Failed to insert record into ${tableName}`, error, {
        projectId,
        tableName,
      })
      throw error
    }
  }

  /**
   * Update a record in a table
   */
  async update(
    projectId: string,
    tableName: string,
    primaryKey: PrimaryKey,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    try {
      // Validate inputs
      this.validateIdentifier(tableName, 'table')
      this.validateIdentifier(primaryKey.column, 'column')

      if (!data || Object.keys(data).length === 0) {
        throw new ValidationError('No data provided for update')
      }

      // Validate all column names
      const columns = Object.keys(data)
      for (const col of columns) {
        this.validateIdentifier(col, 'column')
      }

      // Build SET clause
      const setClause = columns
        .map((col) => `"${col}" = ${this.valueToSql(data[col])}`)
        .join(', ')

      // Build WHERE clause
      const whereClause = `"${primaryKey.column}" = ${this.valueToSql(primaryKey.value)}`

      const query = sql.raw(
        `UPDATE "${tableName}" SET ${setClause} WHERE ${whereClause} RETURNING *`
      )

      const db = await getProjectDb(projectId)
      const result = await db.execute<Record<string, unknown>>(query)

      if (!result || result.length === 0) {
        throw new ValidationError('Record not found or update failed')
      }

      logger.info(`Updated record in ${tableName}`, {
        projectId,
        tableName,
        primaryKey: primaryKey.value,
      })

      return result[0]
    } catch (error) {
      logger.error(`Failed to update record in ${tableName}`, error, {
        projectId,
        tableName,
        primaryKey: primaryKey.value,
      })
      throw error
    }
  }

  /**
   * Delete a record from a table
   */
  async delete(
    projectId: string,
    tableName: string,
    primaryKey: PrimaryKey
  ): Promise<Record<string, unknown>> {
    try {
      // Validate inputs
      this.validateIdentifier(tableName, 'table')
      this.validateIdentifier(primaryKey.column, 'column')

      // Build WHERE clause
      const whereClause = `"${primaryKey.column}" = ${this.valueToSql(primaryKey.value)}`

      const query = sql.raw(`DELETE FROM "${tableName}" WHERE ${whereClause} RETURNING *`)

      const db = await getProjectDb(projectId)
      const result = await db.execute<Record<string, unknown>>(query)

      if (!result || result.length === 0) {
        throw new ValidationError('Record not found or delete failed')
      }

      logger.warn(`Deleted record from ${tableName}`, {
        projectId,
        tableName,
        primaryKey: primaryKey.value,
      })

      return result[0]
    } catch (error) {
      logger.error(`Failed to delete record from ${tableName}`, error, {
        projectId,
        tableName,
        primaryKey: primaryKey.value,
      })
      throw error
    }
  }

  /**
   * Bulk delete records from a table
   */
  async bulkDelete(
    projectId: string,
    tableName: string,
    primaryKey: { column: string; values: unknown[] }
  ): Promise<number> {
    try {
      // Validate inputs
      this.validateIdentifier(tableName, 'table')
      this.validateIdentifier(primaryKey.column, 'column')

      if (!primaryKey.values || primaryKey.values.length === 0) {
        throw new ValidationError('No records specified for bulk delete')
      }

      // Build IN clause
      const valuesList = primaryKey.values.map((val) => this.valueToSql(val)).join(', ')
      const whereClause = `"${primaryKey.column}" IN (${valuesList})`

      const query = sql.raw(`DELETE FROM "${tableName}" WHERE ${whereClause} RETURNING *`)

      const db = await getProjectDb(projectId)
      const result = await db.execute<Record<string, unknown>>(query)

      const deletedCount = result.length

      logger.warn(`Bulk deleted ${deletedCount} records from ${tableName}`, {
        projectId,
        tableName,
        count: deletedCount,
      })

      return deletedCount
    } catch (error) {
      logger.error(`Failed to bulk delete records from ${tableName}`, error, {
        projectId,
        tableName,
      })
      throw error
    }
  }

  /**
   * Select records from a table with pagination and filtering
   */
  async select(
    projectId: string,
    tableName: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<Record<string, unknown>>> {
    try {
      // Validate table name
      this.validateIdentifier(tableName, 'table')

      const { page = 1, limit = 100, orderBy, orderDirection = 'asc', search, searchColumns = [] } = options

      // Validate order by column if provided
      if (orderBy) {
        this.validateIdentifier(orderBy, 'column')
      }

      // Validate search columns
      for (const col of searchColumns) {
        this.validateIdentifier(col, 'column')
      }

      const db = await getProjectDb(projectId)

      // Build WHERE clause for search
      let whereClause = ''
      if (search && searchColumns.length > 0) {
        const searchConditions = searchColumns
          .map((col) => `"${col}"::text ILIKE ${this.valueToSql(`%${search}%`)}`)
          .join(' OR ')
        whereClause = `WHERE ${searchConditions}`
      }

      // Build ORDER BY clause
      let orderByClause = ''
      if (orderBy) {
        orderByClause = `ORDER BY "${orderBy}" ${orderDirection.toUpperCase()}`
      }

      // Calculate offset
      const offset = (page - 1) * limit

      // Get total count
      const countQuery = sql.raw(`SELECT COUNT(*) as count FROM "${tableName}" ${whereClause}`)
      const countResult = await db.execute<{ count: number }>(countQuery)
      const total = countResult[0]?.count || 0

      // Get data with pagination
      const dataQuery = sql.raw(
        `SELECT * FROM "${tableName}" ${whereClause} ${orderByClause} LIMIT ${limit} OFFSET ${offset}`
      )
      const rows = await db.execute<Record<string, unknown>>(dataQuery)

      logger.debug(`Selected records from ${tableName}`, {
        projectId,
        tableName,
        page,
        limit,
        total,
        rowCount: rows.length,
      })

      return {
        rows,
        total,
        page,
        limit,
      }
    } catch (error) {
      logger.error(`Failed to select records from ${tableName}`, error, {
        projectId,
        tableName,
      })
      throw error
    }
  }

  /**
   * Count records in a table
   */
  async count(projectId: string, tableName: string): Promise<number> {
    try {
      this.validateIdentifier(tableName, 'table')

      const query = sql.raw(`SELECT COUNT(*) as count FROM "${tableName}"`)

      const db = await getProjectDb(projectId)
      const result = await db.execute<{ count: number }>(query)

      return result[0]?.count || 0
    } catch (error) {
      logger.error(`Failed to count records in ${tableName}`, error, {
        projectId,
        tableName,
      })
      throw error
    }
  }
}
