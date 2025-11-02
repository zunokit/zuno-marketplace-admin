/**
 * Project Validation Schemas
 * Consolidated Zod schemas for project management
 * Combines strict validation with comprehensive coverage
 */

import { z } from 'zod';
import { VALIDATION_RULES, VALIDATION_MESSAGES, DATABASE_CONFIG } from '@/lib/constants';

/**
 * Project metadata schema
 */
export const projectMetadataSchema = z.object({
  icon: z.string().optional(),
  color: z
    .string()
    .regex(
      VALIDATION_RULES.PROJECT.METADATA.COLOR_PATTERN,
      VALIDATION_MESSAGES.PROJECT.METADATA.COLOR_INVALID
    )
    .optional(),
  features: z.array(z.string()).optional(),
});

export type ProjectMetadata = z.infer<typeof projectMetadataSchema>;

/**
 * Project creation schema - strict validation for new projects
 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(
      VALIDATION_RULES.PROJECT.NAME.MIN_LENGTH,
      VALIDATION_MESSAGES.PROJECT.NAME.TOO_SHORT
    )
    .max(
      VALIDATION_RULES.PROJECT.NAME.MAX_LENGTH,
      VALIDATION_MESSAGES.PROJECT.NAME.TOO_LONG
    )
    .regex(
      VALIDATION_RULES.PROJECT.NAME.PATTERN,
      VALIDATION_MESSAGES.PROJECT.NAME.INVALID_FORMAT
    ),

  slug: z
    .string()
    .min(
      VALIDATION_RULES.PROJECT.SLUG.MIN_LENGTH,
      VALIDATION_MESSAGES.PROJECT.SLUG.TOO_SHORT
    )
    .max(
      VALIDATION_RULES.PROJECT.SLUG.MAX_LENGTH,
      VALIDATION_MESSAGES.PROJECT.SLUG.TOO_LONG
    )
    .regex(
      VALIDATION_RULES.PROJECT.SLUG.PATTERN,
      VALIDATION_MESSAGES.PROJECT.SLUG.INVALID_FORMAT
    ),

  description: z
    .string()
    .min(
      VALIDATION_RULES.PROJECT.DESCRIPTION.MIN_LENGTH,
      VALIDATION_MESSAGES.PROJECT.DESCRIPTION.TOO_SHORT
    )
    .max(
      VALIDATION_RULES.PROJECT.DESCRIPTION.MAX_LENGTH,
      VALIDATION_MESSAGES.PROJECT.DESCRIPTION.TOO_LONG
    )
    .optional(),

  projectType: z
    .string()
    .min(
      VALIDATION_RULES.PROJECT.TYPE.MIN_LENGTH,
      VALIDATION_MESSAGES.PROJECT.TYPE.REQUIRED
    )
    .max(
      VALIDATION_RULES.PROJECT.TYPE.MAX_LENGTH,
      VALIDATION_MESSAGES.PROJECT.TYPE.TOO_LONG
    ),

  databaseUrl: z
    .string()
    .url(VALIDATION_MESSAGES.PROJECT.DATABASE_URL.INVALID)
    .startsWith(
      DATABASE_CONFIG.PROTOCOL,
      VALIDATION_MESSAGES.PROJECT.DATABASE_URL.INVALID_PROTOCOL
    ),

  logo: z
    .string()
    .url(VALIDATION_MESSAGES.PROJECT.LOGO.INVALID)
    .optional()
    .nullable(),

  metadata: projectMetadataSchema.optional(),

  status: z.enum(['active', 'inactive', 'archived']).default('active'),

  icon: z.string().optional(),
  color: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/**
 * Project update schema (all fields optional except id)
 */
export const updateProjectSchema = z.object({
  id: z.string().uuid(VALIDATION_MESSAGES.PROJECT.ID.INVALID),

  name: z
    .string()
    .min(VALIDATION_RULES.PROJECT.NAME.MIN_LENGTH)
    .max(VALIDATION_RULES.PROJECT.NAME.MAX_LENGTH)
    .regex(VALIDATION_RULES.PROJECT.NAME.PATTERN)
    .optional(),

  slug: z
    .string()
    .min(VALIDATION_RULES.PROJECT.SLUG.MIN_LENGTH)
    .max(VALIDATION_RULES.PROJECT.SLUG.MAX_LENGTH)
    .regex(VALIDATION_RULES.PROJECT.SLUG.PATTERN)
    .optional(),

  description: z
    .string()
    .min(VALIDATION_RULES.PROJECT.DESCRIPTION.MIN_LENGTH)
    .max(VALIDATION_RULES.PROJECT.DESCRIPTION.MAX_LENGTH)
    .optional()
    .nullable(),

  projectType: z
    .string()
    .min(VALIDATION_RULES.PROJECT.TYPE.MIN_LENGTH)
    .max(VALIDATION_RULES.PROJECT.TYPE.MAX_LENGTH)
    .optional(),

  databaseUrl: z
    .string()
    .url()
    .startsWith(DATABASE_CONFIG.PROTOCOL)
    .optional(),

  logo: z.string().url().optional().nullable(),

  metadata: projectMetadataSchema.optional(),

  status: z.enum(['active', 'inactive', 'archived']).optional(),

  icon: z.string().optional(),
  color: z.string().optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/**
 * Project update form schema (without id for form)
 */
export const updateProjectFormSchema = z.object({
  name: z
    .string()
    .min(VALIDATION_RULES.PROJECT.NAME.MIN_LENGTH)
    .max(VALIDATION_RULES.PROJECT.NAME.MAX_LENGTH)
    .regex(VALIDATION_RULES.PROJECT.NAME.PATTERN)
    .optional(),

  slug: z
    .string()
    .min(VALIDATION_RULES.PROJECT.SLUG.MIN_LENGTH)
    .max(VALIDATION_RULES.PROJECT.SLUG.MAX_LENGTH)
    .regex(VALIDATION_RULES.PROJECT.SLUG.PATTERN)
    .optional(),

  description: z
    .string()
    .min(VALIDATION_RULES.PROJECT.DESCRIPTION.MIN_LENGTH)
    .max(VALIDATION_RULES.PROJECT.DESCRIPTION.MAX_LENGTH)
    .optional()
    .nullable(),

  projectType: z
    .string()
    .min(VALIDATION_RULES.PROJECT.TYPE.MIN_LENGTH)
    .max(VALIDATION_RULES.PROJECT.TYPE.MAX_LENGTH)
    .optional(),

  databaseUrl: z
    .string()
    .url()
    .startsWith(DATABASE_CONFIG.PROTOCOL)
    .optional(),

  logo: z.string().url().optional().nullable(),

  metadata: projectMetadataSchema.optional(),

  status: z.enum(['active', 'inactive', 'archived']).optional(),

  icon: z.string().optional(),
  color: z.string().optional(),
});

export type UpdateProjectFormInput = z.infer<typeof updateProjectFormSchema>;

/**
 * Project environment schema
 */
export const createProjectEnvironmentSchema = z.object({
  organizationId: z
    .string()
    .min(1, VALIDATION_MESSAGES.ENVIRONMENT.ORGANIZATION_ID.REQUIRED),
  name: z
    .string()
    .min(1, VALIDATION_MESSAGES.ENVIRONMENT.NAME.REQUIRED)
    .max(
      VALIDATION_RULES.ENVIRONMENT.NAME.MAX_LENGTH,
      VALIDATION_MESSAGES.ENVIRONMENT.NAME.TOO_LONG
    ),
  slug: z
    .string()
    .min(1, VALIDATION_MESSAGES.ENVIRONMENT.SLUG.REQUIRED)
    .max(
      VALIDATION_RULES.ENVIRONMENT.SLUG.MAX_LENGTH,
      VALIDATION_MESSAGES.ENVIRONMENT.SLUG.TOO_LONG
    )
    .regex(
      VALIDATION_RULES.ENVIRONMENT.SLUG.PATTERN,
      VALIDATION_MESSAGES.ENVIRONMENT.SLUG.INVALID_FORMAT
    ),
  databaseUrl: z.string().min(1, VALIDATION_MESSAGES.ENVIRONMENT.DATABASE_URL.REQUIRED),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type CreateProjectEnvironmentInput = z.infer<typeof createProjectEnvironmentSchema>;

/**
 * Update project environment schema
 */
export const updateProjectEnvironmentSchema = createProjectEnvironmentSchema
  .partial()
  .extend({
    id: z.string().min(1, VALIDATION_MESSAGES.ENVIRONMENT.ID.REQUIRED),
  });

export type UpdateProjectEnvironmentInput = z.infer<typeof updateProjectEnvironmentSchema>;

/**
 * Project query schema
 */
export const projectQuerySchema = z.object({
  page: z.coerce
    .number()
    .min(VALIDATION_RULES.QUERY.PAGE.MIN)
    .default(VALIDATION_RULES.QUERY.PAGE.DEFAULT),
  limit: z.coerce
    .number()
    .min(VALIDATION_RULES.QUERY.LIMIT.MIN)
    .max(VALIDATION_RULES.QUERY.LIMIT.MAX)
    .default(VALIDATION_RULES.QUERY.LIMIT.DEFAULT),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  projectType: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ProjectQueryInput = z.infer<typeof projectQuerySchema>;

/**
 * Project environment query schema
 */
export const projectEnvironmentQuerySchema = z.object({
  organizationId: z
    .string()
    .min(1, VALIDATION_MESSAGES.ENVIRONMENT.ORGANIZATION_ID.REQUIRED),
  page: z.coerce
    .number()
    .min(VALIDATION_RULES.QUERY.PAGE.MIN)
    .default(VALIDATION_RULES.QUERY.PAGE.DEFAULT),
  limit: z.coerce
    .number()
    .min(VALIDATION_RULES.QUERY.LIMIT.MIN)
    .max(VALIDATION_RULES.QUERY.LIMIT.MAX)
    .default(VALIDATION_RULES.QUERY.LIMIT.DEFAULT),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type ProjectEnvironmentQueryInput = z.infer<typeof projectEnvironmentQuerySchema>;

/**
 * Project audit log schema
 */
export const projectAuditLogSchema = z.object({
  organizationId: z
    .string()
    .min(1, VALIDATION_MESSAGES.AUDIT.ORGANIZATION_ID.REQUIRED),
  userId: z.string().min(1, VALIDATION_MESSAGES.AUDIT.USER_ID.REQUIRED),
  action: z.enum([
    'created',
    'updated',
    'deleted',
    'environment_added',
    'environment_updated',
    'environment_deleted',
    'member_added',
    'member_removed',
    'member_role_updated',
  ]),
  entityType: z.enum(['project', 'environment', 'member']),
  entityId: z.string().min(1, VALIDATION_MESSAGES.AUDIT.ENTITY_ID.REQUIRED),
  oldValues: z.any().optional(),
  newValues: z.any().optional(),
  metadata: z.any().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export type ProjectAuditLogInput = z.infer<typeof projectAuditLogSchema>;

/**
 * Audit log query schema
 */
export const auditLogQuerySchema = z.object({
  organizationId: z
    .string()
    .min(1, VALIDATION_MESSAGES.AUDIT.ORGANIZATION_ID.REQUIRED),
  page: z.coerce
    .number()
    .min(VALIDATION_RULES.QUERY.PAGE.MIN)
    .default(VALIDATION_RULES.QUERY.PAGE.DEFAULT),
  limit: z.coerce
    .number()
    .min(VALIDATION_RULES.QUERY.LIMIT.MIN)
    .max(VALIDATION_RULES.QUERY.LIMIT.MAX)
    .default(VALIDATION_RULES.QUERY.LIMIT.AUDIT_DEFAULT),
  action: z
    .enum([
      'created',
      'updated',
      'deleted',
      'environment_added',
      'environment_updated',
      'environment_deleted',
      'member_added',
      'member_removed',
      'member_role_updated',
    ])
    .optional(),
  entityType: z.enum(['project', 'environment', 'member']).optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;

/**
 * Project migration schema (for migrating hardcoded projects)
 */
export const projectMigrationSchema = z.object({
  id: z.string().min(1, VALIDATION_MESSAGES.PROJECT.ID.REQUIRED),
  name: z.string().min(1, VALIDATION_MESSAGES.PROJECT.NAME.REQUIRED),
  slug: z.string().min(1, VALIDATION_MESSAGES.PROJECT.SLUG.REQUIRED),
  databaseUrl: z.string().optional(),
  description: z.string().optional(),
  metadata: projectMetadataSchema.optional(),
});

export type ProjectMigrationInput = z.infer<typeof projectMigrationSchema>;
