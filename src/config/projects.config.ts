import { z } from 'zod'

/**
 * Project Configuration Schema
 * Defines the structure for each project in the multi-project admin system
 */
export const ProjectConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  databaseUrl: z.string().optional(),
  description: z.string().optional(),
  metadata: z
    .object({
      icon: z.string().optional(),
      color: z.string().optional(),
      features: z.array(z.string()).optional(),
    })
    .optional(),
})

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>

/**
 * Central Project Registry
 * This is the single source of truth for all projects in the system
 * Each project represents an organization in better-auth
 */
export const PROJECTS_REGISTRY = {
  abis: {
    id: 'abis',
    name: '@zuno-marketplace-abis',
    slug: 'zuno-abis',
    databaseUrl: process.env.ABIS_DATABASE_URL,
    description: 'Zuno Marketplace ABIs - Smart contract ABI management',
    metadata: {
      icon: '📋',
      color: '#3b82f6',
      features: ['ABI Management', 'Contract Registry', 'Version Control'],
    },
  },
  metadata: {
    id: 'metadata',
    name: '@zuno-marketplace-metadata',
    slug: 'zuno-metadata',
    databaseUrl: process.env.METADATA_DATABASE_URL,
    description: 'Zuno Marketplace Metadata - NFT and token metadata service',
    metadata: {
      icon: '🏷️',
      color: '#8b5cf6',
      features: ['Metadata Storage', 'IPFS Integration', 'Token Standards'],
    },
  },
} as const satisfies Record<string, ProjectConfig>

/**
 * Project IDs type for type safety
 */
export type ProjectId = keyof typeof PROJECTS_REGISTRY

/**
 * Get project configuration by ID
 */
export function getProjectConfig(projectId: ProjectId): ProjectConfig {
  const config = PROJECTS_REGISTRY[projectId]
  if (!config) {
    throw new Error(`Project configuration not found: ${projectId}`)
  }
  return config
}

/**
 * Get all projects as an array
 */
export function getAllProjects(): ProjectConfig[] {
  return Object.values(PROJECTS_REGISTRY)
}

/**
 * Check if a project ID exists
 */
export function isValidProjectId(projectId: string): projectId is ProjectId {
  return projectId in PROJECTS_REGISTRY
}

/**
 * Get project by slug
 */
export function getProjectBySlug(slug: string): ProjectConfig | undefined {
  return Object.values(PROJECTS_REGISTRY).find((project) => project.slug === slug)
}
