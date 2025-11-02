import { z } from 'zod'

/**
 * Project metadata schema
 */
export const ProjectMetadataSchema = z.object({
  icon: z.string().optional(),
  color: z.string().optional(),
  features: z.array(z.string()).optional(),
})

/**
 * Project creation schema
 */
export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  slug: z.string().min(1, 'Project slug is required').max(50).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  projectType: z.string().optional(),
  databaseUrl: z.string().optional(),
  metadata: ProjectMetadataSchema.optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  icon: z.string().optional(),
  color: z.string().optional(),
})

/**
 * Project update schema
 */
export const UpdateProjectSchema = CreateProjectSchema.partial().extend({
  id: z.string().min(1, 'Project ID is required'),
})

/**
 * Project environment schema
 */
export const CreateProjectEnvironmentSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  name: z.string().min(1, 'Environment name is required').max(50),
  slug: z.string().min(1, 'Environment slug is required').max(20).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  databaseUrl: z.string().min(1, 'Database URL is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

/**
 * Update project environment schema
 */
export const UpdateProjectEnvironmentSchema = CreateProjectEnvironmentSchema.partial().extend({
  id: z.string().min(1, 'Environment ID is required'),
})

/**
 * Project query schema
 */
export const ProjectQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  projectType: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * Project environment query schema
 */
export const ProjectEnvironmentQuerySchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
})

/**
 * Project audit log schema
 */
export const ProjectAuditLogSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  action: z.enum(['created', 'updated', 'deleted', 'environment_added', 'environment_updated', 'environment_deleted', 'member_added', 'member_removed', 'member_role_updated']),
  entityType: z.enum(['project', 'environment', 'member']),
  entityId: z.string().min(1, 'Entity ID is required'),
  oldValues: z.any().optional(),
  newValues: z.any().optional(),
  metadata: z.any().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
})

/**
 * Audit log query schema
 */
export const AuditLogQuerySchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  action: z.enum(['created', 'updated', 'deleted', 'environment_added', 'environment_updated', 'environment_deleted', 'member_added', 'member_removed', 'member_role_updated']).optional(),
  entityType: z.enum(['project', 'environment', 'member']).optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

/**
 * Project migration schema (for migrating hardcoded projects)
 */
export const ProjectMigrationSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
  name: z.string().min(1, 'Project name is required'),
  slug: z.string().min(1, 'Project slug is required'),
  databaseUrl: z.string().optional(),
  description: z.string().optional(),
  metadata: ProjectMetadataSchema.optional(),
})

// Export types
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>
export type ProjectQueryInput = z.infer<typeof ProjectQuerySchema>
export type CreateProjectEnvironmentInput = z.infer<typeof CreateProjectEnvironmentSchema>
export type UpdateProjectEnvironmentInput = z.infer<typeof UpdateProjectEnvironmentSchema>
export type ProjectEnvironmentQueryInput = z.infer<typeof ProjectEnvironmentQuerySchema>
export type ProjectAuditLogInput = z.infer<typeof ProjectAuditLogSchema>
export type AuditLogQueryInput = z.infer<typeof AuditLogQuerySchema>
export type ProjectMigrationInput = z.infer<typeof ProjectMigrationSchema>
export type ProjectMetadata = z.infer<typeof ProjectMetadataSchema>