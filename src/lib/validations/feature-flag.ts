/**
 * Feature Flag Validation Schemas
 * Zod schemas for feature flag management
 */

import { z } from 'zod';

/**
 * Feature flag key validation
 * Must be kebab-case: lowercase letters, numbers, and hyphens only
 */
export const featureFlagKeySchema = z
  .string()
  .min(1, 'Feature flag key is required')
  .max(100, 'Feature flag key must be less than 100 characters')
  .regex(/^[a-z0-9-]+$/, 'Feature flag key must be kebab-case (lowercase letters, numbers, and hyphens only)');

/**
 * Create feature flag schema
 */
export const createFeatureFlagSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  name: z
    .string()
    .min(1, 'Feature flag name is required')
    .max(255, 'Feature flag name must be less than 255 characters'),
  key: featureFlagKeySchema,
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  isEnabled: z.boolean().default(false),
  configuration: z.record(z.string(), z.unknown()).optional(),
});

export type CreateFeatureFlagInput = z.infer<typeof createFeatureFlagSchema>;

/**
 * Update feature flag schema
 */
export const updateFeatureFlagSchema = z.object({
  id: z.string().min(1, 'Feature flag ID is required'),
  name: z
    .string()
    .min(1, 'Feature flag name is required')
    .max(255, 'Feature flag name must be less than 255 characters')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
  isEnabled: z.boolean().optional(),
  configuration: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type UpdateFeatureFlagInput = z.infer<typeof updateFeatureFlagSchema>;

/**
 * Feature flag query schema
 */
export const featureFlagQuerySchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  isEnabled: z.coerce.boolean().optional(),
});

export type FeatureFlagQueryInput = z.infer<typeof featureFlagQuerySchema>;

/**
 * Check feature flag schema
 */
export const checkFeatureFlagSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  key: featureFlagKeySchema,
});

export type CheckFeatureFlagInput = z.infer<typeof checkFeatureFlagSchema>;

/**
 * Toggle feature flag schema
 */
export const toggleFeatureFlagSchema = z.object({
  id: z.string().min(1, 'Feature flag ID is required'),
});

export type ToggleFeatureFlagInput = z.infer<typeof toggleFeatureFlagSchema>;

/**
 * Delete feature flag schema
 */
export const deleteFeatureFlagSchema = z.object({
  id: z.string().min(1, 'Feature flag ID is required'),
});

export type DeleteFeatureFlagInput = z.infer<typeof deleteFeatureFlagSchema>;
