"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAuth } from "@/lib/auth/middleware";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { ForbiddenError } from "@/lib/utils/error-handler";
import {
  serverActionSuccess,
  serverActionError,
  type ServerActionResponse,
} from "@/lib/utils/api-response";
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "@/lib/validations/project";
import { CACHE_TAGS, CACHE_REVALIDATION, DATABASE_CONFIG } from "@/lib/constants";
import { container } from "@/lib/core/di-container";

export async function getAllProjectsAction(): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth();
    const isSuperAdminUser = await isSuperAdmin(session.user.id);

    if (!isSuperAdminUser) {
      throw new ForbiddenError("Only super admins can list all projects");
    }

    const listProjectsUseCase = container.listProjectsUseCase();
    const result = await listProjectsUseCase.execute(
      {
        page: 1,
        limit: 1000,
        sortBy: "name",
        sortOrder: "asc",
      },
      session.user.id
    );

    return serverActionSuccess(result.projects);
  } catch (error) {
    return serverActionError(error);
  }
}

export async function getProjectByIdAction(
  projectId: string
): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth();
    const isSuperAdminUser = await isSuperAdmin(session.user.id);

    if (!isSuperAdminUser) {
      throw new ForbiddenError("Only super admins can view project details");
    }

    const getProjectUseCase = container.getProjectUseCase();
    const project = await getProjectUseCase.execute(projectId, session.user.id);

    return serverActionSuccess(project);
  } catch (error) {
    return serverActionError(error);
  }
}

export async function createProjectAction(
  input: CreateProjectInput
): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth();
    const isSuperAdminUser = await isSuperAdmin(session.user.id);

    if (!isSuperAdminUser) {
      throw new ForbiddenError("Only super admins can create projects");
    }

    const validatedInput = createProjectSchema.parse(input);
    const createProjectUseCase = container.createProjectUseCase();

    const project = await createProjectUseCase.execute(validatedInput, {
      userId: session.user.id,
    });

    revalidatePath(CACHE_REVALIDATION.PATHS.PROJECTS_LIST);
    revalidatePath(CACHE_REVALIDATION.PATHS.PROJECTS_INDEX);
    revalidateTag(CACHE_TAGS.PROJECT_REGISTRY, 'max');

    return serverActionSuccess(
      {
        ...project,
        databaseUrl: DATABASE_CONFIG.ENCRYPTED_PLACEHOLDER,
      },
      "Project created successfully"
    );
  } catch (error) {
    return serverActionError(error);
  }
}

export async function updateProjectAction(
  input: UpdateProjectInput
): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth();
    const isSuperAdminUser = await isSuperAdmin(session.user.id);

    if (!isSuperAdminUser) {
      throw new ForbiddenError("Only super admins can update projects");
    }

    const validatedInput = updateProjectSchema.parse(input);
    const updateProjectUseCase = container.updateProjectUseCase();

    const project = await updateProjectUseCase.execute(validatedInput, {
      userId: session.user.id,
    });

    revalidatePath(CACHE_REVALIDATION.PATHS.PROJECTS_LIST);
    revalidatePath(`/projects/${validatedInput.id}`);
    revalidateTag(CACHE_TAGS.PROJECT_REGISTRY, 'max');

    return serverActionSuccess(
      {
        ...project,
        databaseUrl: project.databaseUrl ? DATABASE_CONFIG.ENCRYPTED_PLACEHOLDER : null,
      },
      "Project updated successfully"
    );
  } catch (error) {
    return serverActionError(error);
  }
}

export async function deleteProjectAction(
  projectId: string
): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth();
    const isSuperAdminUser = await isSuperAdmin(session.user.id);

    if (!isSuperAdminUser) {
      throw new ForbiddenError("Only super admins can delete projects");
    }

    const deleteProjectUseCase = container.deleteProjectUseCase();
    await deleteProjectUseCase.execute(projectId, {
      userId: session.user.id,
    });

    revalidatePath(CACHE_REVALIDATION.PATHS.PROJECTS_LIST);
    revalidatePath(CACHE_REVALIDATION.PATHS.PROJECTS_INDEX);
    revalidateTag(CACHE_TAGS.PROJECT_REGISTRY, 'max');

    return serverActionSuccess(
      { deleted: true },
      "Project deleted successfully"
    );
  } catch (error) {
    return serverActionError(error);
  }
}

export async function getProjectsRegistryAction(): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth();
    const getProjectsRegistryUseCase = container.getProjectsRegistryUseCase();
    const registry = await getProjectsRegistryUseCase.execute(session.user.id);

    return serverActionSuccess(registry);
  } catch (error) {
    return serverActionError(error);
  }
}

export async function testProjectConnectionAction(
  projectId: string
): Promise<ServerActionResponse> {
  try {
    const session = await requireAuth();
    const isSuperAdminUser = await isSuperAdmin(session.user.id);

    if (!isSuperAdminUser) {
      throw new ForbiddenError("Only super admins can test database connections");
    }

    const testProjectConnectionUseCase = container.testProjectConnectionUseCase();
    const result = await testProjectConnectionUseCase.execute(projectId, session.user.id);

    return serverActionSuccess(result);
  } catch (error) {
    return serverActionError(error);
  }
}
