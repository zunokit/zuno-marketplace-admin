/**
 * Execute Query Use Case
 * Handles secure SQL query execution with validation and permissions
 */

import type { IQueryRepository } from '@/lib/core/domain/interfaces/query.repository.interface'
import type { QueryResult, QueryExecutionParams } from '@/lib/core/domain/entities/query.entity'
import { QueryValidationService } from '@/lib/core/services/query-validation.service'
import { ValidationError } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'

interface ExecuteQueryInput extends QueryExecutionParams {
  hasUpdatePermission: boolean
}

export class ExecuteQueryUseCase {
  private validationService: QueryValidationService

  constructor(private queryRepository: IQueryRepository) {
    this.validationService = new QueryValidationService()
  }

  async execute(input: ExecuteQueryInput): Promise<QueryResult> {
    const { projectId, query, userId, hasUpdatePermission } = input

    // Sanitize query
    const sanitizedQuery = this.validationService.sanitizeQuery(query)

    // Validate query
    const validation = this.validationService.validateQuery(
      sanitizedQuery,
      hasUpdatePermission
    )

    if (!validation.isValid) {
      logger.warn('Query validation failed', {
        userId,
        projectId,
        errors: validation.errors,
        queryPreview: sanitizedQuery.substring(0, 100),
      })
      throw new ValidationError(validation.errors.join('; '))
    }

    // Estimate complexity and log
    const complexity = this.validationService.estimateComplexity(sanitizedQuery)
    logger.info('Executing query', {
      userId,
      projectId,
      isReadOnly: validation.isReadOnly,
      complexity,
      queryPreview: sanitizedQuery.substring(0, 100),
    })

    // Execute query
    const result = await this.queryRepository.execute(projectId, sanitizedQuery)

    logger.info('Query executed successfully', {
      userId,
      projectId,
      rowCount: result.rowCount,
      executionTime: result.executionTime,
    })

    return result
  }
}
