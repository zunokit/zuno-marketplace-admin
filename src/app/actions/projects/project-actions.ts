"use server";

/**
 * Server Actions for Project Management (Super Admin Only)
 * Allows dynamic creation, update, and deletion of projects
 */

import { randomUUID } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organization as organizationTable } from "@/lib/db/schemas/auth.schema";
import { requireAuth } from "@/lib/auth/middleware";
import { isSuperAdmin } from "@/lib/auth/permissions";
import {
  errorHandler,
  ForbiddenError,
  ValidationError,
  NotFoundError,
} from "@/lib/utils/error-handler";
import {
  serverActionSuccess,
  serverActionError,
  type ServerActionResponse,
} from "@/lib/utils/api-response";
import { logger } from "@/lib/utils/logger";
import { encrypt, decrypt } from "@/lib/crypto";
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "@/lib/validations/project";
import { DATABASE_CONFIG, CACHE_TAGS, CACHE_REVALIDATION } from "@/lib/constants";

/**
 * Get all projects (organizations)
 */
export async function getAllProjectsAction(): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth();

    // Only super admins can list all projects
    const isSuperAdminUser = await isSuperAdmin(session.user.id);
    if (!isSuperAdminUser) {
      throw new ForbiddenError("Only super admins can list all projects");
    }

    const projects = await errorHandler(async () => {
      const results = await db.query.organization.findMany({
        orderBy: (orgs, { asc }) => [asc(orgs.name)],
      });

      // Don't return encrypted database URLs in list view
      return results.map((project) => ({
        ...project,
        databaseUrl: project.databaseUrl ? DATABASE_CONFIG.ENCRYPTED_PLACEHOLDER : null,
      }));
    }, "getAllProjects");

    logger.info("Retrieved all projects", {
      count: projects.length,
      userId: session.user.id,
    });

    return serverActionSuccess(projects);
  } catch (error) {
    return serverActionError(error);
  }
}

/**
 * Get a single project by ID
 */
export async function getProjectByIdAction(
  projectId: string
): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth();

    const isSuperAdminUser = await isSuperAdmin(session.user.id);
    if (!isSuperAdminUser) {
      throw new ForbiddenError("Only super admins can view project details");
    }

    const project = await errorHandler(async () => {
      const result = await db.query.organization.findFirst({
        where: eq(organizationTable.id, projectId),
      });

      if (!result) {
        throw new NotFoundError("Project not found");
      }

      // Decrypt database URL for super admin viewing
      if (result.databaseUrl) {
        result.databaseUrl = decrypt(result.databaseUrl);
      }

      return result;
    }, "getProjectById");

    logger.info("Retrieved project details", {
      projectId,
      userId: session.user.id,
    });

    return serverActionSuccess(project);
  } catch (error) {
    return serverActionError(error);
  }
}

/**
 * Create a new project
 */
export async function createProjectAction(
  input: CreateProjectInput
): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth();

    // Only super admins can create projects
    const isSuperAdminUser = await isSuperAdmin(session.user.id);
    if (!isSuperAdminUser) {
      throw new ForbiddenError("Only super admins can create projects");
    }

    // Validate input
    const validatedInput = createProjectSchema.parse(input);

    const project = await errorHandler(async () => {
      // Check if slug is already taken
      const existing = await db.query.organization.findFirst({
        where: eq(organizationTable.slug, validatedInput.slug),
      });

      if (existing) {
        throw new ValidationError("A project with this slug already exists");
      }

      // Encrypt database URL before storing
      const encryptedDatabaseUrl = encrypt(validatedInput.databaseUrl);

      // Create project
      const [newProject] = await db
        .insert(organizationTable)
        .values({
          id: randomUUID(),
          name: validatedInput.name,
          slug: validatedInput.slug,
          projectType: validatedInput.projectType,
          databaseUrl: encryptedDatabaseUrl,
          logo: validatedInput.logo || null,
          metadataJson: validatedInput.metadata || null,
          createdAt: new Date(),
        })
        .returning();

      logger.info("Created new project", {
        projectId: newProject.id,
        name: newProject.name,
        slug: newProject.slug,
        userId: session.user.id,
      });

      // Don't return encrypted URL
      return {
        ...newProject,
        databaseUrl: DATABASE_CONFIG.ENCRYPTED_PLACEHOLDER,
      };
    }, "createProject");

    revalidatePath(CACHE_REVALIDATION.PATHS.PROJECTS_LIST);
    revalidatePath(CACHE_REVALIDATION.PATHS.PROJECTS_INDEX);
    revalidateTag(CACHE_TAGS.PROJECT_REGISTRY);

    return serverActionSuccess(project, "Project created successfully");
  } catch (error) {
    return serverActionError(error);
  }
}

/**
 * Update an existing project
 */
export async function updateProjectAction(
  input: UpdateProjectInput
): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth();

    const isSuperAdminUser = await isSuperAdmin(session.user.id);
    if (!isSuperAdminUser) {
      throw new ForbiddenError("Only super admins can update projects");
    }

    // Validate input
    const validatedInput = updateProjectSchema.parse(input);

    const project = await errorHandler(async () => {
      // Check if project exists
      const existing = await db.query.organization.findFirst({
        where: eq(organizationTable.id, validatedInput.id),
      });

      if (!existing) {
        throw new NotFoundError("Project not found");
      }

      // If updating slug, check it's not taken
      if (validatedInput.slug && validatedInput.slug !== existing.slug) {
        const slugExists = await db.query.organization.findFirst({
          where: eq(organizationTable.slug, validatedInput.slug),
        });

        if (slugExists) {
          throw new ValidationError("A project with this slug already exists");
        }
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {};

      if (validatedInput.name) updateData.name = validatedInput.name;
      if (validatedInput.slug) updateData.slug = validatedInput.slug;
      if (validatedInput.projectType)
        updateData.projectType = validatedInput.projectType;
      if (validatedInput.logo !== undefined)
        updateData.logo = validatedInput.logo;
      if (validatedInput.metadata !== undefined)
        updateData.metadataJson = validatedInput.metadata;

      // Encrypt database URL if updating
      if (validatedInput.databaseUrl) {
        updateData.databaseUrl = encrypt(validatedInput.databaseUrl);
      }

      updateData.updatedAt = new Date();

      // Update project
      const [updated] = await db
        .update(organizationTable)
        .set(updateData)
        .where(eq(organizationTable.id, validatedInput.id))
        .returning();

      logger.info("Updated project", {
        projectId: updated.id,
        changes: Object.keys(updateData),
        userId: session.user.id,
      });

      return {
        ...updated,
        databaseUrl: updated.databaseUrl ? DATABASE_CONFIG.ENCRYPTED_PLACEHOLDER : null,
      };
    }, "updateProject");

    revalidatePath(CACHE_REVALIDATION.PATHS.PROJECTS_LIST);
    revalidatePath(`/projects/${validatedInput.id}`);
    revalidateTag(CACHE_TAGS.PROJECT_REGISTRY);

    return serverActionSuccess(project, "Project updated successfully");
  } catch (error) {
    return serverActionError(error);
  }
}

/**
 * Delete a project
 */
export async function deleteProjectAction(
  projectId: string
): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth();

    const isSuperAdminUser = await isSuperAdmin(session.user.id);
    if (!isSuperAdminUser) {
      throw new ForbiddenError("Only super admins can delete projects");
    }

    await errorHandler(async () => {
      // Check if project exists
      const existing = await db.query.organization.findFirst({
        where: eq(organizationTable.id, projectId),
      });

      if (!existing) {
        throw new NotFoundError("Project not found");
      }

      // Delete project (will cascade delete members and invitations)
      await db
        .delete(organizationTable)
        .where(eq(organizationTable.id, projectId));

      logger.warn("Deleted project", {
        projectId,
        projectName: existing.name,
        userId: session.user.id,
      });
    }, "deleteProject");

    revalidatePath(CACHE_REVALIDATION.PATHS.PROJECTS_LIST);
    revalidatePath(CACHE_REVALIDATION.PATHS.PROJECTS_INDEX);
    revalidateTag(CACHE_TAGS.PROJECT_REGISTRY);

    return serverActionSuccess(
      { deleted: true },
      "Project deleted successfully"
    );
  } catch (error) {
    return serverActionError(error);
  }
}

/**
 * Get projects registry (for client components)
 * Returns projects in registry format: Record<string, ProjectConfig>
 */
export async function getProjectsRegistryAction(): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth();

    // Import ProjectRegistryService here to avoid bundling in client
    const { ProjectRegistryService } = await import(
      "@/lib/services/project-registry.service"
    );

    const registry = await errorHandler(async () => {
      return await ProjectRegistryService.getProjectsRegistry();
    }, "getProjectsRegistry");

    logger.debug("Retrieved projects registry", {
      projectCount: Object.keys(registry).length,
      userId: session.user.id,
    });

    return serverActionSuccess(registry);
  } catch (error) {
    return serverActionError(error);
  }
}

/**
 * Test database connection for a project
 */
export async function testProjectConnectionAction(
  databaseUrl: string
): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth();

    const isSuperAdminUser = await isSuperAdmin(session.user.id);
    if (!isSuperAdminUser) {
      throw new ForbiddenError(
        "Only super admins can test database connections"
      );
    }

    // Validate URL format
    if (!databaseUrl.startsWith(DATABASE_CONFIG.PROTOCOL)) {
      throw new ValidationError("Invalid PostgreSQL connection string");
    }

    const result = await errorHandler(async () => {
      // Import postgres dynamically
      const postgres = (await import("postgres")).default;

      // Try to connect with short timeout
      const sql = postgres(databaseUrl, {
        max: DATABASE_CONFIG.TEST_CONNECTION.MAX_CONNECTIONS,
        connect_timeout: DATABASE_CONFIG.TEST_CONNECTION.CONNECT_TIMEOUT,
        idle_timeout: DATABASE_CONFIG.TEST_CONNECTION.IDLE_TIMEOUT,
      });

      try {
        // Test query
        await sql`SELECT 1 as test`;
        await sql.end();

        logger.info("Database connection test successful", {
          userId: session.user.id,
        });

        return { success: true, message: "Connection successful" };
      } catch (error) {
        await sql.end();
        throw new ValidationError(
          "Failed to connect to database: " +
            (error instanceof Error ? error.message : "Unknown error")
        );
      }
    }, "testProjectConnection");

    return serverActionSuccess(result);
  } catch (error) {
    return serverActionError(error);
  }
}
