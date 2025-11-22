import { NotFoundError } from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';
import type { IFeatureFlagRepository } from '@/lib/core/domain/interfaces/feature-flag.repository.interface';
import type { FeatureFlagEntity } from '@/lib/core/domain/entities/feature-flag.entity';

export interface UpdateFeatureFlagInput {
  id: string;
  name?: string;
  description?: string | null;
  isEnabled?: boolean;
  configuration?: Record<string, unknown> | null;
}

export interface RequestContext {
  userId: string;
}

export class UpdateFeatureFlagUseCase {
  constructor(private readonly featureFlagRepository: IFeatureFlagRepository) {}

  async execute(
    input: UpdateFeatureFlagInput,
    context: RequestContext
  ): Promise<FeatureFlagEntity> {
    // Verify feature flag exists
    const existingFlag = await this.featureFlagRepository.findById(input.id);
    if (!existingFlag) {
      throw new NotFoundError('Feature flag not found');
    }

    const updatedFlag = await this.featureFlagRepository.update(input.id, {
      name: input.name,
      description: input.description,
      isEnabled: input.isEnabled,
      configuration: input.configuration,
    });

    logger.info('Feature flag updated', {
      featureFlagId: input.id,
      organizationId: existingFlag.organizationId,
      key: existingFlag.key,
      userId: context.userId,
    });

    return updatedFlag;
  }
}
