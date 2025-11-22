import { NotFoundError } from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';
import type { IFeatureFlagRepository } from '@/lib/core/domain/interfaces/feature-flag.repository.interface';

export interface RequestContext {
  userId: string;
}

export class DeleteFeatureFlagUseCase {
  constructor(private readonly featureFlagRepository: IFeatureFlagRepository) {}

  async execute(id: string, context: RequestContext): Promise<void> {
    // Verify feature flag exists
    const existingFlag = await this.featureFlagRepository.findById(id);
    if (!existingFlag) {
      throw new NotFoundError('Feature flag not found');
    }

    await this.featureFlagRepository.delete(id);

    logger.info('Feature flag deleted', {
      featureFlagId: id,
      organizationId: existingFlag.organizationId,
      key: existingFlag.key,
      userId: context.userId,
    });
  }
}
