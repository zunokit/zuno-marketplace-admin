import { NotFoundError } from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';
import type { IFeatureFlagRepository } from '@/lib/core/domain/interfaces/feature-flag.repository.interface';
import type { FeatureFlagEntity } from '@/lib/core/domain/entities/feature-flag.entity';

export interface RequestContext {
  userId: string;
}

export class ToggleFeatureFlagUseCase {
  constructor(private readonly featureFlagRepository: IFeatureFlagRepository) {}

  async execute(id: string, context: RequestContext): Promise<FeatureFlagEntity> {
    // Verify feature flag exists
    const existingFlag = await this.featureFlagRepository.findById(id);
    if (!existingFlag) {
      throw new NotFoundError('Feature flag not found');
    }

    const toggledFlag = await this.featureFlagRepository.toggle(id);

    logger.info('Feature flag toggled', {
      featureFlagId: id,
      organizationId: existingFlag.organizationId,
      key: existingFlag.key,
      newState: toggledFlag.isEnabled,
      userId: context.userId,
    });

    return toggledFlag;
  }
}
