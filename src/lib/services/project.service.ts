import { eq, and, desc, asc, ilike, count, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  organization,
  projectEnvironment,
  projectAuditLog,
  type Organization,
  type NewOrganization,
  type NewProjectEnvironment,
  type NewProjectAuditLog,
} from "@/lib/db/schemas/auth.schema";
import {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectQueryInput,
  CreateProjectEnvironmentInput,
  UpdateProjectEnvironmentInput,
  ProjectEnvironmentQueryInput,
  ProjectAuditLogInput,
  AuditLogQueryInput,
} from "@/lib/validations/project.validation";
import { encrypt, decrypt, generateSecureId } from "@/lib/crypto/encryption";

/**
 * Project service class
 */
export class ProjectService {
  /**
   * Create a new project
   */
  static async createProject(
    data: CreateProjectInput,
    userId: string,
    requestInfo?: { ip?: string; userAgent?: string }
  ) {
    try {
      const projectId = generateSecureId();

      // Encrypt database URL if provided
      const encryptedDatabaseUrl = data.databaseUrl
        ? encrypt(data.databaseUrl)
        : null;

      const projectData: NewOrganization = {
        id: projectId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        projectType: data.projectType,
        databaseUrl: encryptedDatabaseUrl,
        status: data.status,
        icon: data.icon,
        color: data.color,
        metadataJson: data.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create project
      const [project] = await db
        .insert(organization)
        .values(projectData)
        .returning();

      // Log audit trail
      await this.logAudit({
        organizationId: projectId,
        userId,
        action: "created",
        entityType: "project",
        entityId: projectId,
        newValues: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          projectType: data.projectType,
          status: data.status,
        },
        ipAddress: requestInfo?.ip,
        userAgent: requestInfo?.userAgent,
      });

      // Note: Revalidation is handled in Server Actions (project-actions.ts)
      // Services should not call revalidatePath/revalidateTag as they may be used in client components

      return project;
    } catch (error) {
      throw new Error(
        `Failed to create project: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Update an existing project
   */
  static async updateProject(
    data: UpdateProjectInput,
    userId: string,
    requestInfo?: { ip?: string; userAgent?: string }
  ) {
    try {
      // Get current project for audit log
      const [currentProject] = await db
        .select()
        .from(organization)
        .where(eq(organization.id, data.id!))
        .limit(1);

      if (!currentProject) {
        throw new Error("Project not found");
      }

      // Prepare update data
      const updateData: Partial<NewOrganization> = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.projectType !== undefined)
        updateData.projectType = data.projectType;
      if (data.databaseUrl !== undefined) {
        updateData.databaseUrl = encrypt(data.databaseUrl);
      }
      if (data.status !== undefined) updateData.status = data.status;
      if (data.icon !== undefined) updateData.icon = data.icon;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.metadata !== undefined) updateData.metadataJson = data.metadata;

      // Update project
      const [updatedProject] = await db
        .update(organization)
        .set(updateData)
        .where(eq(organization.id, data.id!))
        .returning();

      // Log audit trail
      await this.logAudit({
        organizationId: data.id!,
        userId,
        action: "updated",
        entityType: "project",
        entityId: data.id!,
        oldValues: {
          name: currentProject.name,
          slug: currentProject.slug,
          description: currentProject.description,
          projectType: currentProject.projectType,
          status: currentProject.status,
        },
        newValues: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          projectType: data.projectType,
          status: data.status,
        },
        ipAddress: requestInfo?.ip,
        userAgent: requestInfo?.userAgent,
      });

      // Note: Revalidation is handled in Server Actions (project-actions.ts)

      return updatedProject;
    } catch (error) {
      throw new Error(
        `Failed to update project: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Delete a project
   */
  static async deleteProject(
    projectId: string,
    userId: string,
    requestInfo?: { ip?: string; userAgent?: string }
  ) {
    try {
      // Get project for audit log
      const [project] = await db
        .select()
        .from(organization)
        .where(eq(organization.id, projectId))
        .limit(1);

      if (!project) {
        throw new Error("Project not found");
      }

      // Delete project (cascade will handle related records)
      await db.delete(organization).where(eq(organization.id, projectId));

      // Log audit trail
      await this.logAudit({
        organizationId: projectId,
        userId,
        action: "deleted",
        entityType: "project",
        entityId: projectId,
        oldValues: {
          name: project.name,
          slug: project.slug,
        },
        ipAddress: requestInfo?.ip,
        userAgent: requestInfo?.userAgent,
      });

      // Note: Revalidation is handled in Server Actions (project-actions.ts)

      return project;
    } catch (error) {
      throw new Error(
        `Failed to delete project: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get project by ID with decrypted database URL
   */
  static async getProjectById(projectId: string): Promise<Organization | null> {
    try {
      const [project] = await db
        .select()
        .from(organization)
        .where(eq(organization.id, projectId))
        .limit(1);

      if (!project) {
        return null;
      }

      // Decrypt database URL if present
      if (project.databaseUrl) {
        project.databaseUrl = decrypt(project.databaseUrl);
      }

      return project;
    } catch (error) {
      throw new Error(
        `Failed to get project: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get project by slug with decrypted database URL
   */
  static async getProjectBySlug(slug: string): Promise<Organization | null> {
    try {
      const [project] = await db
        .select()
        .from(organization)
        .where(eq(organization.slug, slug))
        .limit(1);

      if (!project) {
        return null;
      }

      // Decrypt database URL if present
      if (project.databaseUrl) {
        project.databaseUrl = decrypt(project.databaseUrl);
      }

      return project;
    } catch (error) {
      throw new Error(
        `Failed to get project by slug: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get all projects with pagination and filtering
   */
  static async getProjects(query: ProjectQueryInput) {
    try {
      const { page, limit, search, status, projectType, sortBy, sortOrder } =
        query;
      const offset = (page - 1) * limit;

      // Build query conditions
      const conditions = [];

      if (search) {
        conditions.push(ilike(organization.name, `%${search}%`));
      }

      if (status) {
        conditions.push(eq(organization.status, status));
      }

      if (projectType) {
        conditions.push(eq(organization.projectType, projectType));
      }

      // Get total count
      const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(organization)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Build order by - use switch for type safety
      let orderBy;
      switch (sortBy) {
        case "name":
          orderBy =
            sortOrder === "desc"
              ? desc(organization.name)
              : asc(organization.name);
          break;
        case "createdAt":
          orderBy =
            sortOrder === "desc"
              ? desc(organization.createdAt)
              : asc(organization.createdAt);
          break;
        case "updatedAt":
          orderBy =
            sortOrder === "desc"
              ? desc(organization.updatedAt)
              : asc(organization.updatedAt);
          break;
        case "status":
          orderBy =
            sortOrder === "desc"
              ? desc(organization.status)
              : asc(organization.status);
          break;
        default:
          orderBy = desc(organization.createdAt); // Default sort
      }

      // Get projects
      const projects = await db
        .select()
        .from(organization)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      // Decrypt database URLs
      const projectsWithDecryptedUrls = projects.map((project) => ({
        ...project,
        databaseUrl: project.databaseUrl ? decrypt(project.databaseUrl) : null,
      }));

      return {
        projects: projectsWithDecryptedUrls,
        pagination: {
          page,
          limit,
          total: Number(totalCount),
          totalPages: Math.ceil(Number(totalCount) / limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get projects: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Create project environment
   */
  static async createProjectEnvironment(
    data: CreateProjectEnvironmentInput,
    userId: string,
    requestInfo?: { ip?: string; userAgent?: string }
  ) {
    try {
      const environmentId = generateSecureId();

      // Encrypt database URL
      const encryptedDatabaseUrl = encrypt(data.databaseUrl);

      const environmentData: NewProjectEnvironment = {
        id: environmentId,
        organizationId: data.organizationId,
        name: data.name,
        slug: data.slug,
        databaseUrl: encryptedDatabaseUrl,
        description: data.description,
        isActive: data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create environment
      const [environment] = await db
        .insert(projectEnvironment)
        .values(environmentData)
        .returning();

      // Log audit trail
      await this.logAudit({
        organizationId: data.organizationId,
        userId,
        action: "environment_added",
        entityType: "environment",
        entityId: environmentId,
        newValues: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          isActive: data.isActive,
        },
        ipAddress: requestInfo?.ip,
        userAgent: requestInfo?.userAgent,
      });

      // Note: Revalidation is handled in Server Actions

      return environment;
    } catch (error) {
      throw new Error(
        `Failed to create project environment: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Update project environment
   */
  static async updateProjectEnvironment(
    data: UpdateProjectEnvironmentInput,
    userId: string,
    requestInfo?: { ip?: string; userAgent?: string }
  ) {
    try {
      // Get current environment
      const [currentEnvironment] = await db
        .select()
        .from(projectEnvironment)
        .where(eq(projectEnvironment.id, data.id!))
        .limit(1);

      if (!currentEnvironment) {
        throw new Error("Environment not found");
      }

      // Prepare update data
      const updateData: Partial<NewProjectEnvironment> = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.databaseUrl !== undefined) {
        updateData.databaseUrl = encrypt(data.databaseUrl);
      }
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      // Update environment
      const [updatedEnvironment] = await db
        .update(projectEnvironment)
        .set(updateData)
        .where(eq(projectEnvironment.id, data.id!))
        .returning();

      // Log audit trail
      await this.logAudit({
        organizationId: currentEnvironment.organizationId,
        userId,
        action: "environment_updated",
        entityType: "environment",
        entityId: data.id!,
        oldValues: {
          name: currentEnvironment.name,
          slug: currentEnvironment.slug,
          isActive: currentEnvironment.isActive,
        },
        newValues: {
          name: data.name,
          slug: data.slug,
          isActive: data.isActive,
        },
        ipAddress: requestInfo?.ip,
        userAgent: requestInfo?.userAgent,
      });

      // Note: Revalidation is handled in Server Actions

      return updatedEnvironment;
    } catch (error) {
      throw new Error(
        `Failed to update project environment: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Delete project environment
   */
  static async deleteProjectEnvironment(
    environmentId: string,
    userId: string,
    requestInfo?: { ip?: string; userAgent?: string }
  ) {
    try {
      // Get environment for audit log
      const [environment] = await db
        .select()
        .from(projectEnvironment)
        .where(eq(projectEnvironment.id, environmentId))
        .limit(1);

      if (!environment) {
        throw new Error("Environment not found");
      }

      // Delete environment
      await db
        .delete(projectEnvironment)
        .where(eq(projectEnvironment.id, environmentId));

      // Log audit trail
      await this.logAudit({
        organizationId: environment.organizationId,
        userId,
        action: "environment_deleted",
        entityType: "environment",
        entityId: environmentId,
        oldValues: {
          name: environment.name,
          slug: environment.slug,
        },
        ipAddress: requestInfo?.ip,
        userAgent: requestInfo?.userAgent,
      });

      // Note: Revalidation is handled in Server Actions

      return environment;
    } catch (error) {
      throw new Error(
        `Failed to delete project environment: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get project environments with decrypted database URLs
   */
  static async getProjectEnvironments(query: ProjectEnvironmentQueryInput) {
    try {
      const { organizationId, page, limit, search, isActive } = query;
      const offset = (page - 1) * limit;

      // Build query conditions
      const conditions = [
        eq(projectEnvironment.organizationId, organizationId),
      ];

      if (search) {
        conditions.push(ilike(projectEnvironment.name, `%${search}%`));
      }

      if (isActive !== undefined) {
        conditions.push(eq(projectEnvironment.isActive, isActive));
      }

      // Get total count
      const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(projectEnvironment)
        .where(and(...conditions));

      // Get environments
      const environments = await db
        .select()
        .from(projectEnvironment)
        .where(and(...conditions))
        .orderBy(desc(projectEnvironment.createdAt))
        .limit(limit)
        .offset(offset);

      // Decrypt database URLs
      const environmentsWithDecryptedUrls = environments.map((environment) => ({
        ...environment,
        databaseUrl: decrypt(environment.databaseUrl),
      }));

      return {
        environments: environmentsWithDecryptedUrls,
        pagination: {
          page,
          limit,
          total: Number(totalCount),
          totalPages: Math.ceil(Number(totalCount) / limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get project environments: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Log audit trail
   */
  private static async logAudit(data: ProjectAuditLogInput) {
    try {
      const auditData: NewProjectAuditLog = {
        id: generateSecureId(),
        organizationId: data.organizationId,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        createdAt: new Date(),
      };

      await db.insert(projectAuditLog).values(auditData);
    } catch (error) {
      // Log audit errors but don't throw to avoid breaking main operations
      console.error("Failed to log audit trail:", error);
    }
  }

  /**
   * Get audit logs for a project
   */
  static async getAuditLogs(query: AuditLogQueryInput) {
    try {
      const {
        organizationId,
        page,
        limit,
        action,
        entityType,
        userId,
        startDate,
        endDate,
      } = query;
      const offset = (page - 1) * limit;

      // Build query conditions
      const conditions = [eq(projectAuditLog.organizationId, organizationId)];

      if (action) conditions.push(eq(projectAuditLog.action, action));
      if (entityType)
        conditions.push(eq(projectAuditLog.entityType, entityType));
      if (userId) conditions.push(eq(projectAuditLog.userId, userId));
      if (startDate)
        conditions.push(gte(projectAuditLog.createdAt, new Date(startDate)));
      if (endDate)
        conditions.push(lte(projectAuditLog.createdAt, new Date(endDate)));

      // Get total count
      const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(projectAuditLog)
        .where(and(...conditions));

      // Get audit logs
      const logs = await db
        .select()
        .from(projectAuditLog)
        .where(and(...conditions))
        .orderBy(desc(projectAuditLog.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        logs,
        pagination: {
          page,
          limit,
          total: Number(totalCount),
          totalPages: Math.ceil(Number(totalCount) / limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get audit logs: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get all projects as registry (for backward compatibility)
   */
  static async getProjectsRegistry() {
    try {
      const projects = await db
        .select()
        .from(organization)
        .where(eq(organization.status, "active"));

      // Transform to registry format with decrypted URLs
      const registry: Record<
        string,
        {
          id: string;
          name: string;
          slug: string;
          databaseUrl: string | null;
          description: string | null;
          metadata: Record<string, unknown> | null;
        }
      > = {};

      for (const project of projects) {
        const decryptedDatabaseUrl = project.databaseUrl
          ? decrypt(project.databaseUrl)
          : null;

        registry[project.id] = {
          id: project.id,
          name: project.name,
          slug: project.slug,
          databaseUrl: decryptedDatabaseUrl,
          description: project.description,
          metadata:
            project.metadataJson &&
            typeof project.metadataJson === "object" &&
            Object.keys(project.metadataJson).length > 0
              ? (project.metadataJson as Record<string, unknown>)
              : {
                  icon: project.icon || undefined,
                  color: project.color || undefined,
                },
        };
      }

      return registry;
    } catch (error) {
      throw new Error(
        `Failed to get projects registry: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
