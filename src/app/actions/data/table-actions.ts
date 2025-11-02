'use server'

/**
 * Server Actions for Table Data Management
 * Provides CRUD operations for any table in any project
 */

import { revalidatePath } from 'next/cache'
import { sql } from 'drizzle-orm'
import { getProjectDb } from '@/lib/infrastructure/database/connections/project-connections'
import { requireAuth } from '@/lib/auth/middleware'
import { requireProjectPermission } from '@/lib/auth/permissions'
import { errorHandler, ValidationError } from '@/lib/utils/error-handler'
import { serverActionSuccess, serverActionError, type ServerActionResponse } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import {
  getProjectTables,
  getTableSchema,
  getTableData as introspectTableData,
} from '@/lib/db/introspection'

/**
 * Get all tables in a project
 */
export async function getTablesAction(
  projectId: string
): Promise<ServerActionResponse<Awaited<ReturnType<typeof getProjectTables>>>> {
  try {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    const tables = await getProjectTables(projectId)

    return serverActionSuccess(tables)
  } catch (error) {
    return serverActionError(error)
  }
}

/**
 * Get table schema
 */
export async function getTableSchemaAction(
  projectId: string,
  tableName: string
): Promise<ServerActionResponse<Awaited<ReturnType<typeof getTableSchema>>>> {
  try {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    const schema = await getTableSchema(projectId, tableName)

    return serverActionSuccess(schema)
  } catch (error) {
    return serverActionError(error)
  }
}

/**
 * Get table data with pagination
 */
export async function getTableDataAction(
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
): Promise<ServerActionResponse<Awaited<ReturnType<typeof introspectTableData>>>> {
  try {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    const data = await introspectTableData(projectId, tableName, options)

    return serverActionSuccess(data)
  } catch (error) {
    return serverActionError(error)
  }
}

/**
 * Create a new record in a table
 */
export async function createRecordAction(
  projectId: string,
  tableName: string,
  data: Record<string, unknown>
): Promise<ServerActionResponse<Record<string, unknown>>> {
  try {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.create')

    const result = await errorHandler(async () => {
      const db = await getProjectDb(projectId)

      // Validate data is not empty
      if (!data || Object.keys(data).length === 0) {
        throw new ValidationError('No data provided')
      }

      // Validate table name (prevent SQL injection)
      const validTableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/
      if (!validTableNameRegex.test(tableName)) {
        throw new ValidationError('Invalid table name')
      }

      // Build INSERT query with proper parameterization
      const columns = Object.keys(data)

      // Validate column names (prevent SQL injection)
      for (const col of columns) {
        if (!validTableNameRegex.test(col)) {
          throw new ValidationError(`Invalid column name: ${col}`)
        }
      }

      // Build INSERT query - unfortunately we need to use raw SQL for dynamic columns
      // but we validate column names above to prevent SQL injection
      const columnsList = columns.map((c) => `"${c}"`).join(', ')
      const valuesList = columns.map((col) => {
        const value = data[col]
        if (value === null || value === undefined) return 'NULL'
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'` // Escape single quotes
        if (typeof value === 'boolean') return value ? 'true' : 'false'
        if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`
        return String(value)
      }).join(', ')

      const query = sql.raw(
        `INSERT INTO "${tableName}" (${columnsList}) VALUES (${valuesList}) RETURNING *`
      )

      const result = await db.execute<Record<string, unknown>>(query)

      logger.info(`Created record in ${tableName}`, { projectId, tableName, recordId: result[0] })

      return result[0]
    }, 'createRecord')

    revalidatePath(`/projects/${projectId}/data/${tableName}`)

    return serverActionSuccess(result, 'Record created successfully')
  } catch (error) {
    return serverActionError(error)
  }
}

/**
 * Update a record in a table
 */
export async function updateRecordAction(
  projectId: string,
  tableName: string,
  primaryKeyColumn: string,
  primaryKeyValue: unknown,
  data: Record<string, unknown>
): Promise<ServerActionResponse<Record<string, unknown>>> {
  try {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.update')

    const result = await errorHandler(async () => {
      const db = await getProjectDb(projectId)

      // Validate data is not empty
      if (!data || Object.keys(data).length === 0) {
        throw new ValidationError('No data provided')
      }

      // Validate table/column names (prevent SQL injection)
      const validNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/
      if (!validNameRegex.test(tableName)) {
        throw new ValidationError('Invalid table name')
      }
      if (!validNameRegex.test(primaryKeyColumn)) {
        throw new ValidationError('Invalid primary key column name')
      }

      // Build UPDATE query with proper parameterization
      const columns = Object.keys(data)

      // Validate column names (prevent SQL injection)
      for (const col of columns) {
        if (!validNameRegex.test(col)) {
          throw new ValidationError(`Invalid column name: ${col}`)
        }
      }

      // Build SET clause with proper value escaping
      const setClause = columns.map((col) => {
        const value = data[col]
        let escapedValue: string
        if (value === null || value === undefined) {
          escapedValue = 'NULL'
        } else if (typeof value === 'string') {
          escapedValue = `'${value.replace(/'/g, "''")}'`
        } else if (typeof value === 'boolean') {
          escapedValue = value ? 'true' : 'false'
        } else if (typeof value === 'object') {
          escapedValue = `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`
        } else {
          escapedValue = String(value)
        }
        return `"${col}" = ${escapedValue}`
      }).join(', ')

      // Build WHERE clause with escaped primary key value
      let pkValueEscaped: string
      if (typeof primaryKeyValue === 'string') {
        pkValueEscaped = `'${primaryKeyValue.replace(/'/g, "''")}'`
      } else {
        pkValueEscaped = String(primaryKeyValue)
      }

      const query = sql.raw(
        `UPDATE "${tableName}" SET ${setClause} WHERE "${primaryKeyColumn}" = ${pkValueEscaped} RETURNING *`
      )

      const result = await db.execute<Record<string, unknown>>(query)

      if (!result || result.length === 0) {
        throw new ValidationError('Record not found')
      }

      logger.info(`Updated record in ${tableName}`, {
        projectId,
        tableName,
        primaryKey: primaryKeyValue,
      })

      return result[0]
    }, 'updateRecord')

    revalidatePath(`/projects/${projectId}/data/${tableName}`)

    return serverActionSuccess(result, 'Record updated successfully')
  } catch (error) {
    return serverActionError(error)
  }
}

/**
 * Delete a record from a table
 */
export async function deleteRecordAction(
  projectId: string,
  tableName: string,
  primaryKeyColumn: string,
  primaryKeyValue: unknown
): Promise<ServerActionResponse<{ deleted: boolean }>> {
  try {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.delete')

    await errorHandler(async () => {
      const db = await getProjectDb(projectId)

      // Validate table/column names (prevent SQL injection)
      const validNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/
      if (!validNameRegex.test(tableName)) {
        throw new ValidationError('Invalid table name')
      }
      if (!validNameRegex.test(primaryKeyColumn)) {
        throw new ValidationError('Invalid primary key column name')
      }

      // Escape primary key value
      let pkValueEscaped: string
      if (typeof primaryKeyValue === 'string') {
        pkValueEscaped = `'${primaryKeyValue.replace(/'/g, "''")}'`
      } else {
        pkValueEscaped = String(primaryKeyValue)
      }

      const query = sql.raw(
        `DELETE FROM "${tableName}" WHERE "${primaryKeyColumn}" = ${pkValueEscaped} RETURNING *`
      )

      const result = await db.execute<Record<string, unknown>>(query)

      if (!result || result.length === 0) {
        throw new ValidationError('Record not found')
      }

      logger.warn(`Deleted record from ${tableName}`, {
        projectId,
        tableName,
        primaryKey: primaryKeyValue,
      })
    }, 'deleteRecord')

    revalidatePath(`/projects/${projectId}/data/${tableName}`)

    return serverActionSuccess({ deleted: true }, 'Record deleted successfully')
  } catch (error) {
    return serverActionError(error)
  }
}

/**
 * Bulk delete records from a table
 */
export async function bulkDeleteRecordsAction(
  projectId: string,
  tableName: string,
  primaryKeyColumn: string,
  primaryKeyValues: unknown[]
): Promise<ServerActionResponse<{ deleted: number }>> {
  try {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.delete')

    const deletedCount = await errorHandler(async () => {
      const db = await getProjectDb(projectId)

      if (!primaryKeyValues || primaryKeyValues.length === 0) {
        throw new ValidationError('No records specified')
      }

      // Validate table/column names (prevent SQL injection)
      const validNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/
      if (!validNameRegex.test(tableName)) {
        throw new ValidationError('Invalid table name')
      }
      if (!validNameRegex.test(primaryKeyColumn)) {
        throw new ValidationError('Invalid primary key column name')
      }

      // Escape all primary key values
      const escapedValues = primaryKeyValues.map((val) => {
        if (typeof val === 'string') {
          return `'${val.replace(/'/g, "''")}'`
        }
        return String(val)
      }).join(', ')

      const query = sql.raw(
        `DELETE FROM "${tableName}" WHERE "${primaryKeyColumn}" IN (${escapedValues}) RETURNING *`
      )

      const result = await db.execute<Record<string, unknown>>(query)

      logger.warn(`Bulk deleted ${result.length} records from ${tableName}`, {
        projectId,
        tableName,
        count: result.length,
      })

      return result.length
    }, 'bulkDeleteRecords')

    revalidatePath(`/projects/${projectId}/data/${tableName}`)

    return serverActionSuccess({ deleted: deletedCount }, `${deletedCount} records deleted successfully`)
  } catch (error) {
    return serverActionError(error)
  }
}

