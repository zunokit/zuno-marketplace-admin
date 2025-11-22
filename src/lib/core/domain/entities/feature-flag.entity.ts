/**
 * Feature Flag Entity
 * Domain entity representing a feature flag
 */

export interface FeatureFlagEntity {
  id: string;
  organizationId: string;
  name: string;
  key: string;
  description: string | null;
  isEnabled: boolean;
  configuration: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeatureFlagInput {
  organizationId: string;
  name: string;
  key: string;
  description?: string;
  isEnabled?: boolean;
  configuration?: Record<string, unknown>;
}

export interface UpdateFeatureFlagInput {
  name?: string;
  description?: string;
  isEnabled?: boolean;
  configuration?: Record<string, unknown>;
}
