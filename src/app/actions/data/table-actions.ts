'use server'

/**
 * Server Actions for Table Data Management
 * Provides CRUD operations for any table in any project
 */

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/middleware'
import { requireProjectPermission } from '@/lib/auth/permissions'
import { serverActionSuccess, serverActionError, type ServerActionResponse } from '@/lib/utils/api-response'
import {
  getProjectTables,
  getTableSchema,
  getTableData as introspectTableData,
} from '@/lib/db/introspection'
import { container } from '@/lib/core/di-container'
import type { PrimaryKey, QueryOptions } from '@/types/domain.types'

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
  options?: QueryOptions
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

    // Use query builder service for safe SQL operations
    const queryBuilder = container.queryBuilderService
    const result = await queryBuilder.insert(projectId, tableName, data)

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

    // Use query builder service for safe SQL operations
    const queryBuilder = container.queryBuilderService
    const primaryKey: PrimaryKey = {
      column: primaryKeyColumn,
      value: primaryKeyValue,
    }

    const result = await queryBuilder.update(projectId, tableName, primaryKey, data)

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

    // Use query builder service for safe SQL operations
    const queryBuilder = container.queryBuilderService
    const primaryKey: PrimaryKey = {
      column: primaryKeyColumn,
      value: primaryKeyValue,
    }

    await queryBuilder.delete(projectId, tableName, primaryKey)

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

    // Use query builder service for safe SQL operations
    const queryBuilder = container.queryBuilderService
    const deletedCount = await queryBuilder.bulkDelete(projectId, tableName, {
      column: primaryKeyColumn,
      values: primaryKeyValues,
    })

    revalidatePath(`/projects/${projectId}/data/${tableName}`)

    return serverActionSuccess({ deleted: deletedCount }, `${deletedCount} records deleted successfully`)
  } catch (error) {
    return serverActionError(error)
  }
}
