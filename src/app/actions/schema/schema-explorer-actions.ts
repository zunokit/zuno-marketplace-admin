'use server'

/**
 * Server Actions for Schema Explorer
 * Provides comprehensive schema metadata for the interactive Schema Explorer UI
 *
 * These actions consolidate multiple introspection queries into unified responses
 * optimized for the Schema Explorer's data requirements.
 */

import { requireAuth } from '@/lib/auth/middleware'
import { requireProjectPermission } from '@/lib/auth/permissions'
import { serverActionSuccess, serverActionError, type ServerActionResponse } from '@/lib/utils/api-response'
import { withServerAction } from '@/lib/utils/try-catch'
import {
  getTableSchema,
  getTableMetadata,
  getTableConstraints,
  getTableIndexes,
  getTableDependencies,
  getDatabaseStatistics as getDbStats,
} from '@/lib/db/introspection'
import { logger } from '@/lib/utils/logger'
import type { TableDetails, DatabaseStatistics } from '@/types/schema-explorer'
import { getTableDDLAction } from './schema-actions'

/**
 * Get comprehensive details for a specific table
 * Consolidates all table metadata into a single response for the Schema Explorer
 *
 * Includes:
 * - Table statistics (size, row count, vacuum times)
 * - Column definitions with types, nullability, defaults
 * - All constraints (PK, FK, UNIQUE, CHECK)
 * - All indexes with types and sizes
 * - Dependencies (foreign key relationships in/out)
 * - Generated DDL (CREATE TABLE statement)
 *
 * @param projectId - The project ID
 * @param tableName - The table name to get details for
 */
export async function getTableDetailsAction(
  projectId: string,
  tableName: string
): Promise<ServerActionResponse<TableDetails>> {
  return withServerAction(async () => {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    logger.debug('Fetching complete table details for Schema Explorer', { projectId, tableName })

    // Fetch all table information in parallel for optimal performance
    const [metadata, columns, constraints, indexes, dependencies, ddlResult] = await Promise.all([
      getTableMetadata(projectId, tableName),
      getTableSchema(projectId, tableName),
      getTableConstraints(projectId, tableName),
      getTableIndexes(projectId, tableName),
      getTableDependencies(projectId, tableName),
      getTableDDLAction(projectId, tableName),
    ])

    // Extract DDL from ServerActionResponse
    const ddl = ddlResult.success ? ddlResult.data : ''

    // Transform metadata to match TableStatistics type
    const statistics = {
      tableName: metadata.tableName,
      schemaName: metadata.schemaName,
      rowCount: metadata.rowCountEstimate,
      totalSize: metadata.totalSize,
      dataSize: metadata.tableSize,
      indexSize: metadata.indexesSize,
      lastVacuum: metadata.lastVacuum?.toISOString(),
      lastAutoVacuum: metadata.lastAutoVacuum?.toISOString(),
      lastAnalyze: metadata.lastAnalyze?.toISOString(),
    }

    // Transform constraints to match schema-explorer Constraint type
    const transformedConstraints = constraints.map((c) => ({
      constraintName: c.constraintName,
      constraintType: c.constraintType,
      columnNames: c.columnNames,
      definition: c.definition,
      referencedTable: c.referencedTable || undefined,
      referencedColumns: c.referencedColumns || undefined,
    }))

    // Transform indexes to match schema-explorer Index type
    const transformedIndexes = indexes.map((idx) => ({
      indexName: idx.indexName,
      indexType: idx.indexType,
      columns: idx.columnNames,
      isUnique: idx.isUnique,
      isPrimary: idx.isPrimary,
      size: idx.indexSize,
    }))

    // Transform dependencies to match schema-explorer TableDependency type
    const transformedDependencies = dependencies.map((dep) => ({
      tableName: dep.tableName,
      dependencyType: dep.dependencyType,
      columnName: dep.foreignKeyColumns.join(', '),
      foreignColumnName: dep.referencedColumns.join(', '),
    }))

    // Build consolidated TableDetails response
    const tableDetails: TableDetails = {
      tableName: metadata.tableName,
      schemaName: metadata.schemaName,
      statistics,
      columns,
      constraints: transformedConstraints,
      indexes: transformedIndexes,
      dependencies: transformedDependencies,
      ddl,
    }

    logger.info('Retrieved complete table details for Schema Explorer', {
      projectId,
      tableName,
      columnCount: columns.length,
      constraintCount: constraints.length,
      indexCount: indexes.length,
      dependencyCount: dependencies.length,
    })

    return tableDetails
  }, 'getTableDetailsAction')
}

/**
 * Get database-wide statistics for the Schema Explorer dashboard
 *
 * Provides overview metrics including:
 * - Total database size
 * - Total number of tables and indexes
 * - Total row count estimate across all tables
 * - Top 10 largest tables by size
 * - Size breakdown (data vs indexes)
 *
 * @param projectId - The project ID
 */
export async function getDatabaseStatisticsAction(
  projectId: string
): Promise<ServerActionResponse<DatabaseStatistics>> {
  return withServerAction(async () => {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    logger.debug('Fetching database statistics for Schema Explorer', { projectId })

    const stats = await getDbStats(projectId)

    // Calculate total data and index sizes
    let totalDataSizeBytes = 0
    let totalIndexSizeBytes = 0

    // Parse sizes from pg_size_pretty output and convert to bytes estimate
    // This is an approximation since we're working with formatted strings
    stats.largestTables.forEach((table) => {
      totalDataSizeBytes += table.tableSizeBytes
    })

    // Calculate index size bytes from data-to-index ratio
    totalIndexSizeBytes = Math.round(totalDataSizeBytes * stats.dataToIndexRatio)

    // Format sizes using pg_size_pretty-like formatting
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 bytes'
      const sizes = ['bytes', 'kB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      const value = bytes / Math.pow(1024, i)
      return `${Math.round(value * 100) / 100} ${sizes[i]}`
    }

    // Transform to match schema-explorer DatabaseStatistics type
    const databaseStatistics: DatabaseStatistics = {
      totalSize: stats.totalSize,
      totalTables: stats.totalTables,
      totalIndexes: stats.totalIndexes,
      totalRows: stats.totalRowsEstimate,
      largestTables: stats.largestTables.map((table) => ({
        tableName: table.tableName,
        size: table.totalSize,
        rowCount: table.rowCountEstimate,
      })),
      sizeBreakdown: {
        dataSize: formatBytes(totalDataSizeBytes),
        indexSize: formatBytes(totalIndexSizeBytes),
        totalSize: stats.totalSize,
      },
    }

    logger.info('Retrieved database statistics for Schema Explorer', {
      projectId,
      totalSize: stats.totalSize,
      totalTables: stats.totalTables,
      totalIndexes: stats.totalIndexes,
      totalRows: stats.totalRowsEstimate,
    })

    return databaseStatistics
  }, 'getDatabaseStatisticsAction')
}

/**
 * Get detailed metadata for a specific table
 * This is a direct wrapper around the introspection function
 *
 * @param projectId - The project ID
 * @param tableName - The table name
 */
export async function getTableMetadataAction(
  projectId: string,
  tableName: string
): Promise<ServerActionResponse<{
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
}>> {
  return withServerAction(async () => {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    logger.debug('Fetching table metadata', { projectId, tableName })

    const metadata = await getTableMetadata(projectId, tableName)

    logger.info('Retrieved table metadata', {
      projectId,
      tableName,
      totalSize: metadata.totalSize,
      rowCount: metadata.rowCountEstimate,
    })

    return metadata
  }, 'getTableMetadataAction')
}

/**
 * Get all indexes for a specific table with usage statistics
 *
 * @param projectId - The project ID
 * @param tableName - The table name
 */
export async function getTableIndexesAction(
  projectId: string,
  tableName: string
): Promise<ServerActionResponse<{
  indexName: string
  indexType: string
  columnNames: string[]
  isUnique: boolean
  isPrimary: boolean
  indexSize: string
  indexDef: string
  tablespace: string | null
}[]>> {
  return withServerAction(async () => {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    logger.debug('Fetching table indexes', { projectId, tableName })

    const indexes = await getTableIndexes(projectId, tableName)

    logger.info('Retrieved table indexes', {
      projectId,
      tableName,
      indexCount: indexes.length,
    })

    return indexes
  }, 'getTableIndexesAction')
}

/**
 * Get all constraints for a specific table
 *
 * @param projectId - The project ID
 * @param tableName - The table name
 */
export async function getTableConstraintsAction(
  projectId: string,
  tableName: string
): Promise<ServerActionResponse<{
  constraintName: string
  constraintType: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK'
  columnNames: string[]
  definition: string
  referencedTable: string | null
  referencedColumns: string[] | null
  updateRule: string | null
  deleteRule: string | null
}[]>> {
  return withServerAction(async () => {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    logger.debug('Fetching table constraints', { projectId, tableName })

    const constraints = await getTableConstraints(projectId, tableName)

    logger.info('Retrieved table constraints', {
      projectId,
      tableName,
      constraintCount: constraints.length,
    })

    return constraints
  }, 'getTableConstraintsAction')
}

/**
 * Generate CREATE TABLE DDL statement for a specific table
 *
 * @param projectId - The project ID
 * @param tableName - The table name
 */
export async function generateTableDDLAction(
  projectId: string,
  tableName: string
): Promise<ServerActionResponse<string>> {
  return withServerAction(async () => {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    logger.debug('Generating table DDL', { projectId, tableName })

    // Use the existing DDL action
    const ddlResult = await getTableDDLAction(projectId, tableName)

    if (!ddlResult.success) {
      throw new Error(ddlResult.error || 'Failed to generate DDL')
    }

    logger.info('Generated table DDL', { projectId, tableName })

    return ddlResult.data
  }, 'generateTableDDLAction')
}

/**
 * Get schema-wide statistics including per-table metrics
 *
 * @param projectId - The project ID
 */
export async function getSchemaStatisticsAction(
  projectId: string
): Promise<ServerActionResponse<DatabaseStatistics>> {
  // This is an alias for getDatabaseStatisticsAction for backwards compatibility
  return getDatabaseStatisticsAction(projectId)
}
