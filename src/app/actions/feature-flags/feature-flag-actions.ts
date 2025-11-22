"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/middleware";
import { checkProjectPermission } from "@/lib/auth/permissions";
import { ForbiddenError } from "@/lib/utils/error-handler";
import { type ServerActionResponse } from "@/lib/utils/api-response";
import { withServerAction } from "@/lib/utils/try-catch";
import {
  createFeatureFlagSchema,
  updateFeatureFlagSchema,
  toggleFeatureFlagSchema,
  deleteFeatureFlagSchema,
  featureFlagQuerySchema,
  checkFeatureFlagSchema,
  type CreateFeatureFlagInput,
  type UpdateFeatureFlagInput,
  type FeatureFlagQueryInput,
  type CheckFeatureFlagInput,
} from "@/lib/validations/feature-flag";
import { container } from "@/lib/core/di-container";
import type { FeatureFlagEntity } from "@/lib/core/domain/entities/feature-flag.entity";
import type { PaginationResult } from "@/lib/core/domain/interfaces/feature-flag.repository.interface";

/**
 * Get all feature flags for an organization
 */
export async function getFeatureFlagsAction(
  input: FeatureFlagQueryInput
): Promise<ServerActionResponse<PaginationResult<FeatureFlagEntity>>> {
  return withServerAction(async () => {
    const session = await requireAuth();
    const validatedInput = featureFlagQuerySchema.parse(input);

    // Check if user has permission to view feature flags for this project
    const hasPermission = await checkProjectPermission(
      session.user.id,
      validatedInput.organizationId,
      'project.settings.read'
    );

    if (!hasPermission) {
      throw new ForbiddenError('You do not have permission to view feature flags for this project');
    }

    const getFeatureFlagsUseCase = container.getFeatureFlagsUseCase();
    const result = await getFeatureFlagsUseCase.execute(validatedInput);

    return result;
  }, 'getFeatureFlagsAction');
}

/**
 * Create a new feature flag
 */
export async function createFeatureFlagAction(
  input: CreateFeatureFlagInput
): Promise<ServerActionResponse<FeatureFlagEntity>> {
  return withServerAction(async () => {
    const session = await requireAuth();
    const validatedInput = createFeatureFlagSchema.parse(input);

    // Check if user has permission to manage feature flags (admin or owner)
    const hasPermission = await checkProjectPermission(
      session.user.id,
      validatedInput.organizationId,
      'project.settings.update'
    );

    if (!hasPermission) {
      throw new ForbiddenError('You do not have permission to create feature flags for this project');
    }

    const createFeatureFlagUseCase = container.createFeatureFlagUseCase();
    const featureFlag = await createFeatureFlagUseCase.execute(validatedInput, {
      userId: session.user.id,
    });

    revalidatePath(`/projects/${validatedInput.organizationId}/settings`);

    return featureFlag;
  }, 'createFeatureFlagAction');
}

/**
 * Update a feature flag
 */
export async function updateFeatureFlagAction(
  input: UpdateFeatureFlagInput
): Promise<ServerActionResponse<FeatureFlagEntity>> {
  return withServerAction(async () => {
    const session = await requireAuth();
    const validatedInput = updateFeatureFlagSchema.parse(input);

    // Get the feature flag to check organization
    const featureFlagRepository = container.featureFlagRepository;
    const existingFlag = await featureFlagRepository.findById(validatedInput.id);

    if (!existingFlag) {
      throw new ForbiddenError('Feature flag not found');
    }

    // Check if user has permission to manage feature flags
    const hasPermission = await checkProjectPermission(
      session.user.id,
      existingFlag.organizationId,
      'project.settings.update'
    );

    if (!hasPermission) {
      throw new ForbiddenError('You do not have permission to update feature flags for this project');
    }

    const updateFeatureFlagUseCase = container.updateFeatureFlagUseCase();
    const featureFlag = await updateFeatureFlagUseCase.execute(validatedInput, {
      userId: session.user.id,
    });

    revalidatePath(`/projects/${existingFlag.organizationId}/settings`);

    return featureFlag;
  }, 'updateFeatureFlagAction');
}

/**
 * Toggle a feature flag on/off
 */
export async function toggleFeatureFlagAction(
  id: string
): Promise<ServerActionResponse<FeatureFlagEntity>> {
  return withServerAction(async () => {
    const session = await requireAuth();
    const validatedInput = toggleFeatureFlagSchema.parse({ id });

    // Get the feature flag to check organization
    const featureFlagRepository = container.featureFlagRepository;
    const existingFlag = await featureFlagRepository.findById(validatedInput.id);

    if (!existingFlag) {
      throw new ForbiddenError('Feature flag not found');
    }

    // Check if user has permission to manage feature flags
    const hasPermission = await checkProjectPermission(
      session.user.id,
      existingFlag.organizationId,
      'project.settings.update'
    );

    if (!hasPermission) {
      throw new ForbiddenError('You do not have permission to toggle feature flags for this project');
    }

    const toggleFeatureFlagUseCase = container.toggleFeatureFlagUseCase();
    const featureFlag = await toggleFeatureFlagUseCase.execute(validatedInput.id, {
      userId: session.user.id,
    });

    revalidatePath(`/projects/${existingFlag.organizationId}/settings`);

    return featureFlag;
  }, 'toggleFeatureFlagAction');
}

/**
 * Delete a feature flag
 */
export async function deleteFeatureFlagAction(
  id: string
): Promise<ServerActionResponse<{ deleted: boolean }>> {
  return withServerAction(async () => {
    const session = await requireAuth();
    const validatedInput = deleteFeatureFlagSchema.parse({ id });

    // Get the feature flag to check organization
    const featureFlagRepository = container.featureFlagRepository;
    const existingFlag = await featureFlagRepository.findById(validatedInput.id);

    if (!existingFlag) {
      throw new ForbiddenError('Feature flag not found');
    }

    // Check if user has permission to manage feature flags
    const hasPermission = await checkProjectPermission(
      session.user.id,
      existingFlag.organizationId,
      'project.settings.update'
    );

    if (!hasPermission) {
      throw new ForbiddenError('You do not have permission to delete feature flags for this project');
    }

    const deleteFeatureFlagUseCase = container.deleteFeatureFlagUseCase();
    await deleteFeatureFlagUseCase.execute(validatedInput.id, {
      userId: session.user.id,
    });

    revalidatePath(`/projects/${existingFlag.organizationId}/settings`);

    return { deleted: true };
  }, 'deleteFeatureFlagAction');
}

/**
 * Check if a feature flag is enabled
 */
export async function checkFeatureFlagAction(
  input: CheckFeatureFlagInput
): Promise<ServerActionResponse<boolean>> {
  return withServerAction(async () => {
    const session = await requireAuth();
    const validatedInput = checkFeatureFlagSchema.parse(input);

    // Check if user has access to this project
    const hasPermission = await checkProjectPermission(
      session.user.id,
      validatedInput.organizationId,
      'project.read'
    );

    if (!hasPermission) {
      throw new ForbiddenError('You do not have permission to access this project');
    }

    const checkFeatureFlagUseCase = container.checkFeatureFlagUseCase();
    const isEnabled = await checkFeatureFlagUseCase.execute(validatedInput);

    return isEnabled;
  }, 'checkFeatureFlagAction');
}
