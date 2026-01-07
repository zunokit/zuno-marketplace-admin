/**
 * Save Query Use Case
 * Handles saving SQL queries for later use
 */

import type { IQueryRepository } from '@/lib/core/domain/interfaces/query.repository.interface'
import type { SavedQuery, CreateSavedQueryData } from '@/lib/core/domain/entities/query.entity'
import { QueryValidationService } from '@/lib/core/services/query-validation.service'
import { ValidationError } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'

export class SaveQueryUseCase {
  private validationService: QueryValidationService

  constructor(private queryRepository: IQueryRepository) {
    this.validationService = new QueryValidationService()
  }

  async execute(data: CreateSavedQueryData): Promise<SavedQuery> {
    // Validate inputs
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Query name is required')
    }

    if (!data.query || data.query.trim().length === 0) {
      throw new ValidationError('Query cannot be empty')
    }

    // Sanitize query
    const sanitizedQuery = this.validationService.sanitizeQuery(data.query)

    // Validate query syntax
    const validation = this.validationService.validateQuery(sanitizedQuery, true)

    if (validation.isDangerous) {
      logger.warn('Attempt to save dangerous query', {
        userId: data.userId,
        projectId: data.projectId,
        name: data.name,
        errors: validation.errors,
      })
      throw new ValidationError('Cannot save queries with dangerous operations')
    }

    // Save query
    const savedQuery = await this.queryRepository.createSavedQuery({
      ...data,
      query: sanitizedQuery,
    })

    logger.info('Query saved successfully', {
      userId: data.userId,
      projectId: data.projectId,
      queryId: savedQuery.id,
      name: savedQuery.name,
    })

    return savedQuery
  }
}
