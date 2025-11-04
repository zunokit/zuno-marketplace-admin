/**
 * Query Validation Service
 * Validates SQL queries for security and safety
 */

import type { QueryValidationResult } from '../domain/entities/query.entity'

export class QueryValidationService {
  /**
   * Check if query is read-only (SELECT only)
   */
  isReadOnlyQuery(query: string): boolean {
    const trimmed = query.trim().toLowerCase()

    // Allow SELECT, SHOW, EXPLAIN, DESCRIBE
    const readOnlyPatterns = [/^select\s/i, /^show\s/i, /^explain\s/i, /^describe\s/i, /^desc\s/i]

    return readOnlyPatterns.some((pattern) => pattern.test(trimmed))
  }

  /**
   * Check if query contains dangerous operations
   */
  isDangerousQuery(query: string): boolean {
    const dangerous = [
      /drop\s+(table|database|schema|index)/i,
      /truncate\s+table/i,
      /alter\s+(table|database)/i,
      /create\s+(table|database|schema)/i,
      /grant\s/i,
      /revoke\s/i,
    ]

    return dangerous.some((pattern) => pattern.test(query))
  }

  /**
   * Validate query for execution
   */
  validateQuery(query: string, allowMutations: boolean = false): QueryValidationResult {
    const errors: string[] = []

    // Check if query is empty
    if (!query || query.trim().length === 0) {
      errors.push('Query cannot be empty')
      return {
        isValid: false,
        isReadOnly: false,
        isDangerous: false,
        errors,
      }
    }

    const isReadOnly = this.isReadOnlyQuery(query)
    const isDangerous = this.isDangerousQuery(query)

    // Check for dangerous operations
    if (isDangerous) {
      errors.push(
        'Dangerous operations (DROP, TRUNCATE, ALTER, CREATE, GRANT, REVOKE) are not allowed through the query interface'
      )
    }

    // Check if mutations are allowed
    if (!isReadOnly && !allowMutations) {
      errors.push('Only read-only queries (SELECT) are allowed without special permissions')
    }

    // Additional security checks
    if (this.containsSuspiciousPatterns(query)) {
      errors.push('Query contains suspicious patterns that may indicate SQL injection')
    }

    return {
      isValid: errors.length === 0,
      isReadOnly,
      isDangerous,
      errors,
    }
  }

  /**
   * Check for suspicious patterns that might indicate SQL injection
   */
  private containsSuspiciousPatterns(query: string): boolean {
    const suspicious = [
      /;\s*drop\s/i,         // Chained DROP
      /;\s*delete\s+from/i,  // Chained DELETE
      /union\s+select/i,     // UNION-based injection
      /'\s*or\s*'1'\s*=\s*'1/i, // Classic injection
      /--\s*$/,              // SQL comment at end
      /\/\*.*\*\//,          // SQL block comments
    ]

    return suspicious.some((pattern) => pattern.test(query))
  }

  /**
   * Sanitize query (remove comments, normalize whitespace)
   */
  sanitizeQuery(query: string): string {
    return query
      .replace(/--.*$/gm, '') // Remove line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  /**
   * Estimate query complexity (simple heuristic)
   */
  estimateComplexity(query: string): 'low' | 'medium' | 'high' {
    const lowerQuery = query.toLowerCase()

    // Count joins
    const joinCount = (lowerQuery.match(/\s+join\s+/g) || []).length

    // Count subqueries
    const subqueryCount = (lowerQuery.match(/\(\s*select\s+/g) || []).length

    // Count aggregations
    const aggregationCount = (lowerQuery.match(/\b(count|sum|avg|max|min|group\s+by)\b/g) || []).length

    const complexityScore = joinCount * 2 + subqueryCount * 3 + aggregationCount

    if (complexityScore >= 10) return 'high'
    if (complexityScore >= 5) return 'medium'
    return 'low'
  }
}
