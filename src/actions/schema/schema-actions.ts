'use server'

/**
 * Server Actions for Schema Visualization
 * Provides complete schema information including tables, columns, and relationships
 */

import { requireAuth } from '@/lib/auth/middleware'
import { requireProjectPermission } from '@/lib/auth/permissions'
import { serverActionSuccess, serverActionError, type ServerActionResponse } from '@/lib/utils/api-response'
import { getTableSchema, getProjectTables } from '@/lib/db/introspection'
import { logger } from '@/lib/utils/logger'

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
