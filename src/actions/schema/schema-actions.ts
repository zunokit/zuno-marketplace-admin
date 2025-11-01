'use server'

/**
 * Server Actions for Schema Visualization
 * Provides complete schema information including tables, columns, and relationships
 */

import { requireAuth } from '@/lib/auth/middleware'
import { requireProjectPermission } from '@/lib/auth/permissions'
import { serverActionSuccess, serverActionError, type ServerActionResponse } from '@/lib/utils/api-response'
import {
  getTableSchema,
  getProjectTables,
  getTableMetadata,
  getTableConstraints,
  getTableIndexes,
  getTableDependencies,
  getDatabaseStatistics,
  type TableMetadata,
  type TableConstraint,
  type TableIndex,
  type TableDependency,
  type DatabaseStatistics,
} from '@/lib/db/introspection'
import { logger } from '@/lib/utils/logger'

// Re-export types for use in components
export type { TableMetadata, TableConstraint, TableIndex, TableDependency, DatabaseStatistics }

export type TableSchemaInfo = {
  tableName: string
  schemaName: string
  rowCount: number
  columns: {
    columnName: string
    dataType: string
    isNullable: boolean
    defaultValue: string | null
    isPrimaryKey: boolean
    isForeignKey: boolean
    foreignKeyTable: string | null
    foreignKeyColumn: string | null
    enumValues: string[] | null
  }[]
}

export type SchemaRelationship = {
  sourceTable: string
  sourceColumn: string
  targetTable: string
  targetColumn: string
  relationshipType: 'one-to-many' | 'many-to-one' | 'one-to-one'
}

export type CompleteSchemaInfo = {
  tables: TableSchemaInfo[]
  relationships: SchemaRelationship[]
}

/**
 * Get complete database schema including all tables, columns, and relationships
 */
export async function getCompleteSchemaAction(
  projectId: string
): Promise<ServerActionResponse<CompleteSchemaInfo>> {
  try {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    logger.debug('Fetching complete schema', { projectId })

    // Get all tables
    const tables = await getProjectTables(projectId)

    // Get schema for each table (columns, types, constraints)
    const tablesWithSchema = await Promise.all(
      tables.map(async (table) => {
        const columns = await getTableSchema(projectId, table.tableName)
        return {
          tableName: table.tableName,
          schemaName: table.schemaName,
          rowCount: table.rowCount,
          columns,
        }
      })
    )

    // Extract relationships from foreign keys
    const relationships: SchemaRelationship[] = []

    for (const table of tablesWithSchema) {
      for (const column of table.columns) {
        if (column.isForeignKey && column.foreignKeyTable && column.foreignKeyColumn) {
          relationships.push({
            sourceTable: table.tableName,
            sourceColumn: column.columnName,
            targetTable: column.foreignKeyTable,
            targetColumn: column.foreignKeyColumn,
            relationshipType: 'many-to-one', // Source has FK to target
          })

          // Also add reverse relationship
          relationships.push({
            sourceTable: column.foreignKeyTable,
            sourceColumn: column.foreignKeyColumn,
            targetTable: table.tableName,
            targetColumn: column.columnName,
            relationshipType: 'one-to-many', // Target is referenced by source
          })
        }
      }
    }

    // Remove duplicate relationships
    const uniqueRelationships = relationships.filter(
      (rel, index, self) =>
        index ===
        self.findIndex(
          (r) =>
            r.sourceTable === rel.sourceTable &&
            r.sourceColumn === rel.sourceColumn &&
            r.targetTable === rel.targetTable &&
            r.targetColumn === rel.targetColumn
        )
    )

    const result: CompleteSchemaInfo = {
      tables: tablesWithSchema,
      relationships: uniqueRelationships,
    }

    logger.info('Retrieved complete schema', {
      projectId,
      tableCount: tablesWithSchema.length,
      relationshipCount: uniqueRelationships.length,
    })

    return serverActionSuccess(result)
  } catch (error) {
    // @ts-expect-error - TODO: Fix ServerActionResponse generic type inference
    return serverActionError(error)
  }
}

/**
 * Get detailed metadata for a specific table
 * Includes table size, index size, vacuum stats, and TOAST table info
 */
export async function getTableMetadataAction(
  projectId: string,
  tableName: string
): Promise<ServerActionResponse<TableMetadata>> {
  try {
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

    return serverActionSuccess(metadata)
  } catch (error) {
    // @ts-expect-error - TODO: Fix ServerActionResponse generic type inference
    return serverActionError(error)
  }
}

/**
 * Get all constraints for a specific table
 * Includes PRIMARY KEY, FOREIGN KEY, UNIQUE, and CHECK constraints with definitions
 */
export async function getTableConstraintsAction(
  projectId: string,
  tableName: string
): Promise<ServerActionResponse<TableConstraint[]>> {
  try {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    logger.debug('Fetching table constraints', { projectId, tableName })

    const constraints = await getTableConstraints(projectId, tableName)

    logger.info('Retrieved table constraints', {
      projectId,
      tableName,
      constraintCount: constraints.length,
    })

    return serverActionSuccess(constraints)
  } catch (error) {
    // @ts-expect-error - TODO: Fix ServerActionResponse generic type inference
    return serverActionError(error)
  }
}

/**
 * Get all indexes for a specific table
 * Includes index type, columns, size, and full definition
 */
export async function getTableIndexesAction(
  projectId: string,
  tableName: string
): Promise<ServerActionResponse<TableIndex[]>> {
  try {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    logger.debug('Fetching table indexes', { projectId, tableName })

    const indexes = await getTableIndexes(projectId, tableName)

    logger.info('Retrieved table indexes', {
      projectId,
      tableName,
      indexCount: indexes.length,
    })

    return serverActionSuccess(indexes)
  } catch (error) {
    // @ts-expect-error - TODO: Fix ServerActionResponse generic type inference
    return serverActionError(error)
  }
}

/**
 * Get table dependencies (foreign key relationships)
 * Shows both tables that reference this table and tables this table references
 */
export async function getTableDependenciesAction(
  projectId: string,
  tableName: string
): Promise<ServerActionResponse<TableDependency[]>> {
  try {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    logger.debug('Fetching table dependencies', { projectId, tableName })

    const dependencies = await getTableDependencies(projectId, tableName)

    logger.info('Retrieved table dependencies', {
      projectId,
      tableName,
      dependencyCount: dependencies.length,
    })

    return serverActionSuccess(dependencies)
  } catch (error) {
    // @ts-expect-error - TODO: Fix ServerActionResponse generic type inference
    return serverActionError(error)
  }
}

/**
 * Get database-wide statistics
 * Includes total size, largest tables, index counts, and data-to-index ratio
 */
export async function getDatabaseStatisticsAction(
  projectId: string
): Promise<ServerActionResponse<DatabaseStatistics>> {
  try {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    logger.debug('Fetching database statistics', { projectId })

    const statistics = await getDatabaseStatistics(projectId)

    logger.info('Retrieved database statistics', {
      projectId,
      totalSize: statistics.totalSize,
      totalTables: statistics.totalTables,
      totalIndexes: statistics.totalIndexes,
      dataToIndexRatio: statistics.dataToIndexRatio.toFixed(2),
    })

    return serverActionSuccess(statistics)
  } catch (error) {
    // @ts-expect-error - TODO: Fix ServerActionResponse generic type inference
    return serverActionError(error)
  }
}

/**
 * Generate CREATE TABLE DDL statement for a specific table
 * Includes all columns, constraints, and indexes in properly formatted SQL
 */
export async function getTableDDLAction(
  projectId: string,
  tableName: string
): Promise<ServerActionResponse<string>> {
  try {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    logger.debug('Generating table DDL', { projectId, tableName })

    // Get schema, constraints, and indexes
    const [columns, constraints, indexes] = await Promise.all([
      getTableSchema(projectId, tableName),
      getTableConstraints(projectId, tableName),
      getTableIndexes(projectId, tableName),
    ])

    // Build CREATE TABLE statement
    let ddl = `CREATE TABLE "${tableName}" (\n`

    // Add columns
    const columnDefs = columns.map((col) => {
      let def = `  "${col.columnName}" ${col.dataType}`

      if (!col.isNullable) {
        def += ' NOT NULL'
      }

      if (col.defaultValue) {
        def += ` DEFAULT ${col.defaultValue}`
      }

      return def
    })

    ddl += columnDefs.join(',\n')

    // Add constraints (excluding indexes which we'll add separately)
    const constraintDefs = constraints
      .filter((c) => c.constraintType !== 'PRIMARY KEY' || !c.definition.includes('USING INDEX'))
      .map((c) => {
        return `  CONSTRAINT "${c.constraintName}" ${c.definition}`
      })

    if (constraintDefs.length > 0) {
      ddl += ',\n' + constraintDefs.join(',\n')
    }

    ddl += '\n);\n'

    // Add indexes (excluding primary key indexes)
    const indexDefs = indexes
      .filter((idx) => !idx.isPrimary)
      .map((idx) => idx.indexDef)
      .join(';\n')

    if (indexDefs) {
      ddl += '\n' + indexDefs + ';'
    }

    logger.info('Generated table DDL', {
      projectId,
      tableName,
      columnCount: columns.length,
      constraintCount: constraints.length,
      indexCount: indexes.length,
    })

    return serverActionSuccess(ddl)
  } catch (error) {
    // @ts-expect-error - TODO: Fix ServerActionResponse generic type inference
    return serverActionError(error)
  }
}
