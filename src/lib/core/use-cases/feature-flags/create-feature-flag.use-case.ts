import { ValidationError } from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';
import type { IFeatureFlagRepository } from '@/lib/core/domain/interfaces/feature-flag.repository.interface';
import type { IEncryptionService } from '@/lib/core/domain/interfaces/encryption.service.interface';
import type { FeatureFlagEntity } from '@/lib/core/domain/entities/feature-flag.entity';

export interface CreateFeatureFlagInput {
  organizationId: string;
  name: string;
  key: string;
  description?: string;
  isEnabled?: boolean;
  configuration?: Record<string, unknown>;
}

export interface RequestContext {
  userId: string;
}

export class CreateFeatureFlagUseCase {
  constructor(
    private readonly featureFlagRepository: IFeatureFlagRepository,
    private readonly encryptionService: IEncryptionService
  ) {}

  async execute(
    input: CreateFeatureFlagInput,
    context: RequestContext
  ): Promise<FeatureFlagEntity> {
    // Check if feature flag key already exists for this organization
    const existingFlag = await this.featureFlagRepository.findByKey(
      input.organizationId,
      input.key
    );

    if (existingFlag) {
      throw new ValidationError('A feature flag with this key already exists for this project');
    }

    const featureFlagId = this.encryptionService.generateSecureId();

    const featureFlag = await this.featureFlagRepository.create({
      id: featureFlagId,
      organizationId: input.organizationId,
      name: input.name,
      key: input.key,
      description: input.description || null,
      isEnabled: input.isEnabled ?? false,
      configuration: input.configuration || null,
    });

    logger.info('Feature flag created', {
      featureFlagId,
      organizationId: input.organizationId,
      key: input.key,
      userId: context.userId,
    });

    return featureFlag;
  }
}
