/**
 * Project Validation Schemas
 * Zod schemas for project management
 */

import { z } from 'zod'

/**
 * Project creation schema
 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must be less than 100 characters')
    .regex(/^[@a-z0-9-]+$/, 'Project name must contain only lowercase letters, numbers, hyphens, and @'),

  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters')
    .optional(),

  projectType: z
    .string()
    .min(2, 'Project type is required')
    .max(50, 'Project type must be less than 50 characters'),

  databaseUrl: z
    .string()
    .url('Invalid database URL')
    .startsWith('postgresql://', 'Must be a PostgreSQL connection string'),

  logo: z
    .string()
    .url('Logo must be a valid URL')
    .optional()
    .nullable(),

  metadata: z
    .object({
      icon: z.string().optional(),
      color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Color must be a valid hex color').optional(),
      features: z.array(z.string()).optional(),
    })
    .optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

/**
 * Project update schema (all fields optional except id)
 */
export const updateProjectSchema = z.object({
  id: z.string().uuid('Invalid project ID'),

  name: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[@a-z0-9-]+$/)
    .optional(),

  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),

  description: z
    .string()
    .min(10)
    .max(500)
    .optional()
    .nullable(),

  projectType: z
    .string()
    .min(2)
    .max(50)
    .optional(),

  databaseUrl: z
    .string()
    .url()
    .startsWith('postgresql://')
    .optional(),

  logo: z
    .string()
    .url()
    .optional()
    .nullable(),

  metadata: z
    .object({
      icon: z.string().optional(),
      color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
      features: z.array(z.string()).optional(),
    })
    .optional(),
})

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

/**
 * Project metadata schema
 */
export const projectMetadataSchema = z.object({
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  features: z.array(z.string()).optional(),
})

export type ProjectMetadata = z.infer<typeof projectMetadataSchema>
