'use server'

/**
 * Server Actions for Foreign Key Reference Options
 * Fetches available options for foreign key select dropdowns with pagination and search
 */

import { sql } from 'drizzle-orm'
import { getProjectDb } from '@/lib/infrastructure/database/connections/project-connections'
import { requireAuth } from '@/lib/auth/middleware'
import { requireProjectPermission } from '@/lib/auth/permissions'
import { errorHandler, ValidationError } from '@/lib/utils/error-handler'
import { serverActionSuccess, serverActionError, type ServerActionResponse } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'

/**
 * Foreign key option item
 */
export interface ForeignKeyOption {
  value: string | number
  label: string
  metadata?: string
}

/**
 * Foreign key options response data
 */
export interface ForeignKeyOptionsData {
  options: ForeignKeyOption[]
  totalCount: number
  hasMore: boolean
  displayColumn: string
  metadataColumn?: string
}

/**
 * Options for fetching foreign key reference data
 */
interface GetForeignKeyOptionsParams {
  search?: string
  limit?: number
  offset?: number
}

/**
 * Valid PostgreSQL identifier regex (prevents SQL injection)
 */
const VALID_IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/**
 * Validate identifier to prevent SQL injection
 */
function validateIdentifier(identifier: string, fieldName: string): void {
  if (!VALID_IDENTIFIER_REGEX.test(identifier)) {
    throw new ValidationError(`Invalid ${fieldName}: ${identifier}`)
  }
}

/**
 * Escape search string for ILIKE query
 */
function escapeSearchString(search: string): string {
  // Escape special characters for ILIKE: %, _, \
  return search.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

/**
 * Auto-determine the best display column for a table
 * Priority order: name, title, label, email, username, description, first varchar/text, primary key
 */
async function determineDisplayColumn(
  db: Awaited<ReturnType<typeof getProjectDb>>,
  tableName: string,
  primaryKeyColumn: string
): Promise<{ displayColumn: string; metadataColumn?: string }> {
  // Get all columns with their types
  const columns = await db.execute<{
    column_name: string
    data_type: string
    ordinal_position: number
  }>(sql`
    SELECT
      column_name,
      data_type,
      ordinal_position
    FROM information_schema.columns
    WHERE table_name = ${tableName}
    ORDER BY ordinal_position
  `)

  if (columns.length === 0) {
    throw new ValidationError(`Table ${tableName} has no columns`)
  }

  // Priority columns for display (in order)
  const priorityColumns = ['name', 'title', 'label', 'email', 'username', 'description']

  // Find priority column
  for (const priorityCol of priorityColumns) {
    const found = columns.find((col) => col.column_name.toLowerCase() === priorityCol)
    if (found) {
      // Try to find a metadata column (email if display is name, or vice versa)
      let metadataColumn: string | undefined

      if (priorityCol === 'name' || priorityCol === 'title') {
        const emailCol = columns.find((col) => col.column_name.toLowerCase() === 'email')
        if (emailCol) metadataColumn = emailCol.column_name
      } else if (priorityCol === 'email') {
        const nameCol = columns.find(
          (col) => col.column_name.toLowerCase() === 'name' || col.column_name.toLowerCase() === 'title'
        )
        if (nameCol) metadataColumn = nameCol.column_name
      }

      return {
        displayColumn: found.column_name,
        metadataColumn,
      }
    }
  }

  // Fallback: Find first varchar/text column
  const textColumn = columns.find(
    (col) =>
      (col.data_type === 'character varying' ||
        col.data_type === 'varchar' ||
        col.data_type === 'text') &&
      col.column_name !== primaryKeyColumn
  )

  if (textColumn) {
    return {
      displayColumn: textColumn.column_name,
    }
  }

  // Final fallback: Use primary key
  return {
    displayColumn: primaryKeyColumn,
  }
}

/**
 * Get the primary key column for a table
 */
async function getPrimaryKeyColumn(
  db: Awaited<ReturnType<typeof getProjectDb>>,
  tableName: string
): Promise<string> {
  const result = await db.execute<{ column_name: string }>(sql`
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_name = ${tableName}
    LIMIT 1
  `)

  if (!result || result.length === 0) {
    throw new ValidationError(`Table ${tableName} has no primary key`)
  }

  return result[0].column_name
}

/**
 * Get foreign key reference options with pagination and search
 *
 * @param projectId - The project ID
 * @param tableName - The referenced table name (e.g., 'users' if FK points to users table)
 * @param columnName - The foreign key column name (not used for querying, but for context)
 * @param options - Pagination and search options
 * @returns Foreign key options with metadata
 *
 * @example
 * // Get options for a user_id foreign key
 * const result = await getForeignKeyOptionsAction('proj_123', 'users', 'user_id', {
 *   search: 'john',
 *   limit: 50,
 *   offset: 0
 * })
 */
export async function getForeignKeyOptionsAction(
  projectId: string,
  tableName: string,
  columnName: string,
  options?: GetForeignKeyOptionsParams
): Promise<ServerActionResponse<ForeignKeyOptionsData>> {
  try {
    const session = await requireAuth()
    await requireProjectPermission(session.user.id, projectId, 'data.read')

    const result = await errorHandler(async () => {
      const db = await getProjectDb(projectId)

      // Validate inputs to prevent SQL injection
      validateIdentifier(tableName, 'table name')
      validateIdentifier(columnName, 'column name')

      // Parse and validate options
      const limit = Math.min(Math.max(options?.limit || 50, 1), 100) // Cap at 100
      const offset = Math.max(options?.offset || 0, 0)
      const search = options?.search?.trim()

      logger.debug('Fetching foreign key options', {
        projectId,
        tableName,
        columnName,
        limit,
        offset,
        search,
      })

      // Get primary key column
      const primaryKeyColumn = await getPrimaryKeyColumn(db, tableName)
      validateIdentifier(primaryKeyColumn, 'primary key column')

      // Auto-determine display column and optional metadata column
      const { displayColumn, metadataColumn } = await determineDisplayColumn(
        db,
        tableName,
        primaryKeyColumn
      )
      validateIdentifier(displayColumn, 'display column')
      if (metadataColumn) {
        validateIdentifier(metadataColumn, 'metadata column')
      }

      // Build SELECT clause
      const selectColumns = [primaryKeyColumn, displayColumn]
      if (metadataColumn && metadataColumn !== displayColumn && metadataColumn !== primaryKeyColumn) {
        selectColumns.push(metadataColumn)
      }
      const selectClause = selectColumns.map((col) => `"${col}"`).join(', ')

      // Build WHERE clause for search (with escaped search term)
      let whereClause = ''
      if (search) {
        const escapedSearch = escapeSearchString(search)
        whereClause = `WHERE CAST("${displayColumn}" AS TEXT) ILIKE '%${escapedSearch}%'`
      }

      // Get total count (without pagination)
      const countQuery = `SELECT COUNT(*) as count FROM "${tableName}" ${whereClause}`
      const countResult = await db.execute<{ count: string }>(sql.raw(countQuery))
      const total = Number(countResult[0]?.count || 0)

      // Get paginated data
      const dataQuery = `
        SELECT ${selectClause} FROM "${tableName}"
        ${whereClause}
        ORDER BY "${displayColumn}" ASC
        LIMIT ${limit} OFFSET ${offset}
      `
      const rows = await db.execute<Record<string, unknown>>(sql.raw(dataQuery))

      // Transform to ForeignKeyOption format
      const optionsData: ForeignKeyOption[] = rows.map((row) => {
        const value = row[primaryKeyColumn] as string | number
        const label = String(row[displayColumn] || value)
        const metadata = metadataColumn ? String(row[metadataColumn] || '') : undefined

        return {
          value,
          label,
          metadata,
        }
      })

      // Calculate if there are more results
      const hasMore = offset + limit < total

      logger.info('Retrieved foreign key options', {
        projectId,
        tableName,
        columnName,
        totalCount: total,
        returned: optionsData.length,
        hasMore,
        displayColumn,
        metadataColumn,
      })

      return {
        options: optionsData,
        totalCount: total,
        hasMore,
        displayColumn,
        metadataColumn,
      }
    }, 'getForeignKeyOptions')

    return serverActionSuccess(result)
  } catch (error) {
    return serverActionError(error)
  }
}
