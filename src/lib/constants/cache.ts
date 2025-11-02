/**
 * Cache Configuration Constants
 * Centralized cache tags and revalidation paths for Next.js caching
 */

export const CACHE_TAGS = {
  PROJECT_REGISTRY: 'project-registry',
  PROJECT_CONFIG: (id: string) => `project-config-${id}`,
  PROJECT_ENVIRONMENTS: (id: string) => `project-environments-${id}`,
  PROJECT_BY_SLUG: (slug: string) => `project-by-slug-${slug}`,
  PROJECT_TYPE_MAPPING: 'project-type-mapping',
  PROJECT_COUNT: 'project-count',
  PROJECT_LIST: 'project-list',
} as const;

export const CACHE_REVALIDATION = {
  PATHS: {
    PROJECTS_LIST: '/dashboard/projects',
    PROJECTS_INDEX: '/projects',
    DASHBOARD: '/dashboard',
  },
} as const;
