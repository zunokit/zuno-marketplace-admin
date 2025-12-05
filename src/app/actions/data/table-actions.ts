'use server'

/**
 * Server Actions for Table Data Management
 * Provides CRUD operations for any table in any project
 */

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/middleware'
import { requireProjectPermission } from '@/lib/auth/permissions'
import { type ServerActionResponse } from '@/lib/utils/api-response'
import { withServerAction } from '@/lib/utils/try-catch'
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
  return withServerAction(async () => {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    return await getProjectTables(projectId)
  }, 'getTablesAction')
}

/**
 * Get table schema
 */
export async function getTableSchemaAction(
  projectId: string,
  tableName: string
): Promise<ServerActionResponse<Awaited<ReturnType<typeof getTableSchema>>>> {
  return withServerAction(async () => {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    return await getTableSchema(projectId, tableName)
  }, 'getTableSchemaAction')
}

/**
 * Get table data with pagination
 */
export async function getTableDataAction(
  projectId: string,
  tableName: string,
  options?: QueryOptions
): Promise<ServerActionResponse<Awaited<ReturnType<typeof introspectTableData>>>> {
  return withServerAction(async () => {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    return await introspectTableData(projectId, tableName, options)
  }, 'getTableDataAction')
}

/**
 * Create a new record in a table
 */
export async function createRecordAction(
  projectId: string,
  tableName: string,
  data: Record<string, unknown>
): Promise<ServerActionResponse<Record<string, unknown>>> {
  return withServerAction(async () => {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.create')

    // Use query builder service for safe SQL operations
    const queryBuilder = container.queryBuilderService
    const result = await queryBuilder.insert(projectId, tableName, data)

    revalidatePath(`/projects/${projectId}/data/${tableName}`)

    return result
  }, 'createRecordAction')
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
  return withServerAction(async () => {
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

    return result
  }, 'updateRecordAction')
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
  return withServerAction(async () => {
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

    return { deleted: true }
  }, 'deleteRecordAction')
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
  return withServerAction(async () => {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.delete')

    // Use query builder service for safe SQL operations
    const queryBuilder = container.queryBuilderService
    const deletedCount = await queryBuilder.bulkDelete(projectId, tableName, {
      column: primaryKeyColumn,
      values: primaryKeyValues,
    })

    revalidatePath(`/projects/${projectId}/data/${tableName}`)

    return { deleted: deletedCount }
  }, 'bulkDeleteRecordsAction')
}
