import { z } from 'zod'
import { ProjectRegistryService } from '@/lib/services/project-registry.service'

/**
 * Project Configuration Schema
 * Defines the structure for each project in the multi-project admin system
 */
export const ProjectConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  databaseUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  metadata: z
    .object({
      icon: z.string().nullable().optional(),
      color: z.string().nullable().optional(),
      features: z.array(z.string()).optional(),
      projectType: z.string().optional(),
    })
    .nullable()
    .optional(),
})

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>

/**
 * Dynamic Project Registry
 * All project data is now loaded from the database via ProjectRegistryService
 * This provides full dynamic project management capabilities
 */

/**
 * Legacy hardcoded registry - REMOVED for full dynamic implementation
 * All projects are now managed through the database and ProjectRegistryService
 */

// Re-export dynamic functions from ProjectRegistryService for easier access
export const getProjectConfig = ProjectRegistryService.getProjectConfig.bind(ProjectRegistryService)
export const getAllProjects = ProjectRegistryService.getAllProjects.bind(ProjectRegistryService)
export const isValidProjectId = ProjectRegistryService.isValidProjectId.bind(ProjectRegistryService)
export const getProjectBySlug = ProjectRegistryService.getProjectBySlug.bind(ProjectRegistryService)
export const getProjectsRegistry = ProjectRegistryService.getProjectsRegistry.bind(ProjectRegistryService)
export const getProjectDatabaseUrl = ProjectRegistryService.getProjectDatabaseUrl.bind(ProjectRegistryService)
export const getProjectDatabaseUrlById = ProjectRegistryService.getProjectDatabaseUrlById.bind(ProjectRegistryService)

// Export additional service functions
export const getProjectTypeMapping = ProjectRegistryService.getProjectTypeMapping.bind(ProjectRegistryService)
export const getProjectsByType = ProjectRegistryService.getProjectsByType.bind(ProjectRegistryService)
export const validateProjectAccess = ProjectRegistryService.validateProjectAccess.bind(ProjectRegistryService)
export const getProjectCountByType = ProjectRegistryService.getProjectCountByType.bind(ProjectRegistryService)
