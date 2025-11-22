/**
 * Feature Flag Repository Interface
 * Defines contract for feature flag data access
 */

import type { FeatureFlagEntity } from '../entities/feature-flag.entity';

export interface CreateFeatureFlagData {
  id: string;
  organizationId: string;
  name: string;
  key: string;
  description?: string | null;
  isEnabled?: boolean;
  configuration?: Record<string, unknown> | null;
}

export interface UpdateFeatureFlagData {
  name?: string;
  description?: string | null;
  isEnabled?: boolean;
  configuration?: Record<string, unknown> | null;
}

export interface FeatureFlagFilters {
  page: number;
  limit: number;
  search?: string;
  isEnabled?: boolean;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IFeatureFlagRepository {
  findById(id: string): Promise<FeatureFlagEntity | null>;
  findByKey(organizationId: string, key: string): Promise<FeatureFlagEntity | null>;
  findByOrganization(
    organizationId: string,
    filters: FeatureFlagFilters
  ): Promise<PaginationResult<FeatureFlagEntity>>;
  findEnabledByOrganization(organizationId: string): Promise<FeatureFlagEntity[]>;
  create(data: CreateFeatureFlagData): Promise<FeatureFlagEntity>;
  update(id: string, data: UpdateFeatureFlagData): Promise<FeatureFlagEntity>;
  toggle(id: string): Promise<FeatureFlagEntity>;
  delete(id: string): Promise<void>;
  isEnabled(organizationId: string, key: string): Promise<boolean>;
  bulkToggle(ids: string[], isEnabled: boolean): Promise<number>;
}
