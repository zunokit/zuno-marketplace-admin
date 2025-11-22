import type { IFeatureFlagRepository } from '@/lib/core/domain/interfaces/feature-flag.repository.interface';
import type { FeatureFlagEntity } from '@/lib/core/domain/entities/feature-flag.entity';
import type { PaginationResult } from '@/lib/core/domain/interfaces/feature-flag.repository.interface';

export interface GetFeatureFlagsInput {
  organizationId: string;
  page?: number;
  limit?: number;
  search?: string;
  isEnabled?: boolean;
}

export class GetFeatureFlagsUseCase {
  constructor(private readonly featureFlagRepository: IFeatureFlagRepository) {}

  async execute(input: GetFeatureFlagsInput): Promise<PaginationResult<FeatureFlagEntity>> {
    const { organizationId, page = 1, limit = 50, search, isEnabled } = input;

    return await this.featureFlagRepository.findByOrganization(organizationId, {
      page,
      limit,
      search,
      isEnabled,
    });
  }
}
