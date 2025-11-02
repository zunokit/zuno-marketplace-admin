import { cache } from "react";
import { ProjectService } from "./project.service";
import type { ProjectConfig } from "@/config/projects.config";
import type { ProjectEnvironment } from "@/lib/db/schemas/auth.schema";

/**
 * Dynamic Project Registry Service
 * Replaces the hardcoded PROJECTS_REGISTRY with database lookups
 */
export class ProjectRegistryService {
  private static readonly CACHE_TAGS = {
    PROJECT_REGISTRY: "project-registry",
    PROJECT_CONFIG: (id: string) => `project-config-${id}`,
    PROJECT_ENVIRONMENTS: (id: string) => `project-environments-${id}`,
    PROJECT_BY_SLUG: (slug: string) => `project-by-slug-${slug}`,
    PROJECT_TYPE_MAPPING: "project-type-mapping",
    PROJECT_COUNT: "project-count",
  };

  /**
   * Get projects registry with caching
   * This replaces the hardcoded PROJECTS_REGISTRY
   * Note: React cache() doesn't support tags directly, cache invalidation is handled via revalidateTag in Server Actions
   */
  static async getProjectsRegistry() {
    return cache(async () => {
      try {
        const registry = await ProjectService.getProjectsRegistry();
        return registry;
      } catch (error) {
        console.error("Failed to get projects registry:", error);
        // Fallback to empty object if database fails
        return {};
      }
    })();
  }

  /**
   * Get project configuration by ID
   * Replaces getProjectConfig function
   */
  static async getProjectConfig(projectId: string) {
    try {
      const project = await ProjectService.getProjectById(projectId);

      if (!project) {
        throw new Error(`Project configuration not found: ${projectId}`);
      }

      // Transform to match the expected format
      return {
        id: project.id,
        name: project.name,
        slug: project.slug,
        databaseUrl: project.databaseUrl,
        description: project.description,
        metadata: project.metadataJson || {
          icon: project.icon,
          color: project.color,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get project configuration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get all projects as an array
   * Replaces getAllProjects function
   */
  static async getAllProjects() {
    try {
      const registry = await this.getProjectsRegistry();
      return Object.values(registry);
    } catch (error) {
      throw new Error(
        `Failed to get all projects: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Check if a project ID exists
   * Replaces isValidProjectId function
   */
  static async isValidProjectId(projectId: string): Promise<boolean> {
    try {
      const project = await ProjectService.getProjectById(projectId);
      return project !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get project by slug
   * Replaces getProjectBySlug function
   */
  static async getProjectBySlug(slug: string) {
    try {
      const project = await ProjectService.getProjectBySlug(slug);

      if (!project) {
        return undefined;
      }

      // Transform to match the expected format
      return {
        id: project.id,
        name: project.name,
        slug: project.slug,
        databaseUrl: project.databaseUrl,
        description: project.description,
        metadata: project.metadataJson || {
          icon: project.icon,
          color: project.color,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get project by slug: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get project database URL by slug (for database connections)
   */
  static async getProjectDatabaseUrl(slug: string): Promise<string | null> {
    try {
      const project = await this.getProjectBySlug(slug);
      return project?.databaseUrl || null;
    } catch (error) {
      console.error(`Failed to get database URL for project ${slug}:`, error);
      return null;
    }
  }

  /**
   * Get project database URL by ID (for database connections)
   */
  static async getProjectDatabaseUrlById(
    projectId: string
  ): Promise<string | null> {
    try {
      const project = await ProjectService.getProjectById(projectId);
      return project?.databaseUrl || null;
    } catch (error) {
      console.error(
        `Failed to get database URL for project ${projectId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Revalidate project registry cache
   * Note: This is a no-op as revalidation is handled in Server Actions
   * Services cannot use revalidateTag/revalidatePath as they may be imported in client components
   */
  static revalidateRegistry() {
    // No-op: Revalidation is handled in Server Actions (project-actions.ts)
    // Services should not call revalidateTag/revalidatePath as they may be used in client components
  }

  /**
   * Get project type mapping
   * Returns a map of project types to their configurations
   */
  static async getProjectTypeMapping() {
    try {
      const projects = await this.getAllProjects();
      const typeMapping: Record<string, ProjectConfig[]> = {};

      for (const project of projects) {
        const projectType: string =
          (project.metadata?.projectType as string) || "unknown";
        if (!typeMapping[projectType]) {
          typeMapping[projectType] = [];
        }
        typeMapping[projectType].push(project);
      }

      return typeMapping;
    } catch (error) {
      throw new Error(
        `Failed to get project type mapping: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get projects by type
   */
  static async getProjectsByType(projectType: string) {
    try {
      const result = await ProjectService.getProjects({
        page: 1,
        limit: 100,
        projectType,
        status: "active",
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      return result.projects;
    } catch (error) {
      throw new Error(
        `Failed to get projects by type: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Validate project access based on user session
   */
  static async validateProjectAccess(projectId: string): Promise<boolean> {
    try {
      // This would integrate with better-auth to check if user has access to the project
      // For now, we'll assume all authenticated users have access
      const project = await ProjectService.getProjectById(projectId);
      return project !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get project count by type
   */
  static async getProjectCountByType() {
    try {
      const result = await ProjectService.getProjects({
        page: 1,
        limit: 1000, // Get all projects
        status: "active",
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const countByType: Record<string, number> = {};

      for (const project of result.projects) {
        const projectType = project.projectType || "unknown";
        countByType[projectType] = (countByType[projectType] || 0) + 1;
      }

      return countByType;
    } catch (error) {
      throw new Error(
        `Failed to get project count by type: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get project environments with caching
   */
  static async getProjectEnvironments(projectId: string) {
    return cache(async () => {
      try {
        const result = await ProjectService.getProjectEnvironments({
          organizationId: projectId,
          page: 1,
          limit: 10,
        });
        return result.environments;
      } catch (error) {
        console.error(
          `Failed to get environments for project ${projectId}:`,
          error
        );
        return [];
      }
    })();
  }

  /**
   * Get active project environment
   */
  static async getActiveProjectEnvironment(
    projectId: string,
    environmentSlug?: string
  ) {
    try {
      const environments = await this.getProjectEnvironments(projectId);

      // If specific environment is requested, return it
      if (environmentSlug) {
        const environment = environments.find(
          (env) => env.slug === environmentSlug && env.isActive
        );
        return environment || null;
      }

      // Return the first active environment (development preference)
      const activeEnvironment = environments.find((env) => env.isActive);
      return activeEnvironment || null;
    } catch (error) {
      console.error(
        `Failed to get active environment for project ${projectId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get project database URL for a specific environment
   */
  static async getProjectEnvironmentDatabaseUrl(
    projectId: string,
    environmentSlug: string
  ): Promise<string | null> {
    try {
      const result = await ProjectService.getProjectEnvironments({
        organizationId: projectId,
        page: 1,
        limit: 1,
      });

      const environment = result.environments.find(
        (env) => env.slug === environmentSlug
      );
      return environment?.databaseUrl || null;
    } catch (error) {
      console.error(
        `Failed to get database URL for project ${projectId} environment ${environmentSlug}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get project configuration with environment-specific database URL
   */
  static async getProjectConfigWithEnvironment(
    projectId: string,
    environmentSlug?: string
  ) {
    try {
      const project = await this.getProjectConfig(projectId);

      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      // If environment is specified, get environment-specific database URL
      if (environmentSlug) {
        const environmentDatabaseUrl =
          await this.getProjectEnvironmentDatabaseUrl(
            projectId,
            environmentSlug
          );
        if (environmentDatabaseUrl) {
          project.databaseUrl = environmentDatabaseUrl;
        }
      } else {
        // Try to get active environment database URL
        const activeEnvironment = await this.getActiveProjectEnvironment(
          projectId
        );
        if (activeEnvironment?.databaseUrl) {
          project.databaseUrl = activeEnvironment.databaseUrl;
        }
      }

      return project;
    } catch (error) {
      throw new Error(
        `Failed to get project configuration with environment: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get project with all environments
   */
  static async getProjectWithEnvironments(projectId: string) {
    try {
      const project = await this.getProjectConfig(projectId);
      const environments = await this.getProjectEnvironments(projectId);

      return {
        ...project,
        environments,
      };
    } catch (error) {
      throw new Error(
        `Failed to get project with environments: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get all projects with their environments
   */
  static async getAllProjectsWithEnvironments() {
    try {
      const projects = await this.getAllProjects();

      const projectsWithEnvironments = await Promise.all(
        projects.map(async (project) => {
          const environments = await this.getProjectEnvironments(project.id);
          return {
            ...project,
            environments,
          };
        })
      );

      return projectsWithEnvironments;
    } catch (error) {
      throw new Error(
        `Failed to get all projects with environments: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
