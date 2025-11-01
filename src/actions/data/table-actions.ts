'use server'

/**
 * Server Actions for Table Data Management
 * Provides CRUD operations for any table in any project
 */

import { revalidatePath } from 'next/cache'
import { sql } from 'drizzle-orm'
import { getProjectDb } from '@/lib/db/connections'
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
    // @ts-expect-error - TODO: Fix ServerActionResponse generic type inference
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
    // @ts-expect-error - TODO: Fix ServerActionResponse generic type inference
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
    // @ts-expect-error - TODO: Fix ServerActionResponse generic type inference
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

      // Build INSERT query
      const columns = Object.keys(data)
      const values = Object.values(data).map((v) =>
        typeof v === 'string' ? `'${v}'` : v === null ? 'NULL' : v
      )

      const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')}) RETURNING *`

      const result = await db.execute<Record<string, unknown>>(sql.raw(query))

      logger.info(`Created record in ${tableName}`, { projectId, tableName, recordId: result[0] })

      return result[0]
    }, 'createRecord')

    revalidatePath(`/projects/${projectId}/data/${tableName}`)

    return serverActionSuccess(result, 'Record created successfully')
  } catch (error) {
    // @ts-expect-error - TODO: Fix ServerActionResponse generic type inference
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

      // Build UPDATE query
      const setClause = Object.entries(data)
        .map(([col, val]) => {
          const value = typeof val === 'string' ? `'${val}'` : val === null ? 'NULL' : val
          return `${col} = ${value}`
        })
        .join(', ')

      const pkValue = typeof primaryKeyValue === 'string' ? `'${primaryKeyValue}'` : primaryKeyValue

      const query = `UPDATE ${tableName} SET ${setClause} WHERE ${primaryKeyColumn} = ${pkValue} RETURNING *`

      const result = await db.execute<Record<string, unknown>>(sql.raw(query))

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
    // @ts-expect-error - TODO: Fix ServerActionResponse generic type inference
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

      const query = `DELETE FROM ${tableName} WHERE ${primaryKeyColumn} = $1 RETURNING *`

      const result = await db.execute<Record<string, unknown>>(sql.raw(query))

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
    // @ts-expect-error - TODO: Fix ServerActionResponse generic type inference
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

      const placeholders = primaryKeyValues.map((_, i) => `$${i + 1}`).join(', ')
      const query = `DELETE FROM ${tableName} WHERE ${primaryKeyColumn} IN (${placeholders}) RETURNING *`

      const result = await db.execute<Record<string, unknown>>(sql.raw(query))

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
    // @ts-expect-error - TODO: Fix ServerActionResponse generic type inference
    return serverActionError(error)
  }
}
