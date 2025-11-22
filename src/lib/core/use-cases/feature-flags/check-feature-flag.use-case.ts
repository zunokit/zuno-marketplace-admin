import type { IFeatureFlagRepository } from '@/lib/core/domain/interfaces/feature-flag.repository.interface';

export interface CheckFeatureFlagInput {
  organizationId: string;
  key: string;
}

export class CheckFeatureFlagUseCase {
  constructor(private readonly featureFlagRepository: IFeatureFlagRepository) {}

  async execute(input: CheckFeatureFlagInput): Promise<boolean> {
    const { organizationId, key } = input;
    return await this.featureFlagRepository.isEnabled(organizationId, key);
  }
}
