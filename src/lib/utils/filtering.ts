/**
 * Filtering Utilities
 * Reusable utilities for filtering data in queries
 */

/**
 * Filter operator types
 */
export type FilterOperator =
  | 'eq'      // Equal
  | 'ne'      // Not equal
  | 'gt'      // Greater than
  | 'gte'     // Greater than or equal
  | 'lt'      // Less than
  | 'lte'     // Less than or equal
  | 'like'    // SQL LIKE (contains)
  | 'ilike'   // Case-insensitive LIKE
  | 'in'      // IN array
  | 'notIn'   // NOT IN array
  | 'isNull'  // IS NULL
  | 'notNull' // IS NOT NULL
  | 'between' // BETWEEN two values

/**
 * Single filter condition
 */
export interface FilterCondition {
  field: string
  operator: FilterOperator
  value?: unknown
  values?: unknown[] // For 'in', 'notIn', 'between'
}

/**
 * Filter group with logical operator
 */
export interface FilterGroup {
  logic: 'AND' | 'OR'
  conditions: (FilterCondition | FilterGroup)[]
}

/**
 * Search parameters for text search across multiple columns
 */
export interface SearchParams {
  query: string
  columns: string[]
  caseSensitive?: boolean
}

/**
 * Complete filter parameters
 */
export interface FilterParams {
  filters?: FilterCondition[]
  search?: SearchParams
  logic?: 'AND' | 'OR' // Default logic for combining filters
}

/**
 * Validate filter operator
 */
export function isValidFilterOperator(operator: string): operator is FilterOperator {
  const validOperators: FilterOperator[] = [
    'eq', 'ne', 'gt', 'gte', 'lt', 'lte',
    'like', 'ilike', 'in', 'notIn', 'isNull', 'notNull', 'between'
  ]
  return validOperators.includes(operator as FilterOperator)
}

/**
 * Validate filter condition
 */
export function isValidFilterCondition(condition: unknown): condition is FilterCondition {
  if (typeof condition !== 'object' || condition === null) return false

  const c = condition as Record<string, unknown>

  return (
    typeof c.field === 'string' &&
    typeof c.operator === 'string' &&
    isValidFilterOperator(c.operator)
  )
}

/**
 * Sanitize filter field name (prevent SQL injection)
 */
export function sanitizeFieldName(field: string): string {
  // Only allow alphanumeric, underscore, and dot (for nested fields)
  return field.replace(/[^a-zA-Z0-9_.]/g, '')
}

/**
 * Build SQL WHERE clause operator
 */
export function buildWhereOperator(operator: FilterOperator): string {
  switch (operator) {
    case 'eq':
      return '='
    case 'ne':
      return '!='
    case 'gt':
      return '>'
    case 'gte':
      return '>='
    case 'lt':
      return '<'
    case 'lte':
      return '<='
    case 'like':
      return 'LIKE'
    case 'ilike':
      return 'ILIKE'
    case 'in':
      return 'IN'
    case 'notIn':
      return 'NOT IN'
    case 'isNull':
      return 'IS NULL'
    case 'notNull':
      return 'IS NOT NULL'
    case 'between':
      return 'BETWEEN'
    default:
      throw new Error(`Unsupported filter operator: ${operator}`)
  }
}

/**
 * Prepare filter value for SQL (add wildcards for LIKE)
 */
export function prepareFilterValue(operator: FilterOperator, value: unknown): unknown {
  if ((operator === 'like' || operator === 'ilike') && typeof value === 'string') {
    return `%${value}%`
  }
  return value
}

/**
 * Create search filter conditions for multiple columns
 */
export function createSearchConditions(search: SearchParams): FilterCondition[] {
  const operator = search.caseSensitive ? 'like' : 'ilike'

  return search.columns.map(column => ({
    field: sanitizeFieldName(column),
    operator,
    value: search.query,
  }))
}

/**
 * Combine filters with search into a single filter group
 */
export function combineFiltersAndSearch(params: FilterParams): FilterGroup | null {
  const allConditions: (FilterCondition | FilterGroup)[] = []

  // Add explicit filters
  if (params.filters && params.filters.length > 0) {
    allConditions.push(...params.filters)
  }

  // Add search conditions
  if (params.search && params.search.query && params.search.columns.length > 0) {
    const searchConditions = createSearchConditions(params.search)
    if (searchConditions.length > 0) {
      // Search conditions are combined with OR (match any column)
      allConditions.push({
        logic: 'OR',
        conditions: searchConditions,
      })
    }
  }

  if (allConditions.length === 0) return null

  return {
    logic: params.logic || 'AND',
    conditions: allConditions,
  }
}

/**
 * Validate filter value based on operator
 */
export function validateFilterValue(operator: FilterOperator, value: unknown): boolean {
  switch (operator) {
    case 'isNull':
    case 'notNull':
      // These operators don't need a value
      return true
    case 'in':
    case 'notIn':
      // These operators need an array
      return Array.isArray(value) && value.length > 0
    case 'between':
      // Between needs exactly 2 values
      return Array.isArray(value) && value.length === 2
    default:
      // Other operators need a defined value
      return value !== undefined && value !== null
  }
}

/**
 * Extract filters from query parameters
 */
export function extractFilterParams(
  query: Record<string, string | string[] | undefined>
): FilterParams {
  const filters: FilterCondition[] = []

  // Extract search params
  const searchQuery = query.search as string | undefined
  const searchColumns = query.searchColumns
    ? (Array.isArray(query.searchColumns) ? query.searchColumns : [query.searchColumns])
    : []

  const search = searchQuery && searchColumns.length > 0
    ? { query: searchQuery, columns: searchColumns }
    : undefined

  // Extract filter params (format: filter[field][operator]=value)
  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith('filter[') && value !== undefined) {
      // Parse filter[field][operator] format
      const match = key.match(/filter\[([^\]]+)\]\[([^\]]+)\]/)
      if (match) {
        const [, field, operator] = match
        if (isValidFilterOperator(operator)) {
          filters.push({
            field: sanitizeFieldName(field),
            operator,
            value,
          })
        }
      }
    }
  }

  return {
    filters: filters.length > 0 ? filters : undefined,
    search,
    logic: 'AND',
  }
}
