import { NotFoundError, ValidationError } from "@/lib/utils/error-handler";
import { logger } from "@/lib/utils/logger";
import type { IProjectRepository } from "@/lib/core/domain/interfaces/project.repository.interface";
import type { IEncryptionService } from "@/lib/core/domain/interfaces/encryption.service.interface";
import type { IProjectAuditLogRepository } from "@/lib/core/domain/interfaces/project.repository.interface";
import type { ProjectEntity } from "@/lib/core/domain/entities/project.entity";
import type { RequestContext } from "./create-project.use-case";

export interface UpdateProjectInput {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  projectType?: string;
  databaseUrl?: string;
  logo?: string | null;
  icon?: string;
  color?: string;
  status?: "active" | "inactive" | "archived";
  metadata?: Record<string, unknown>;
}

export class UpdateProjectUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly encryptionService: IEncryptionService,
    private readonly auditLogRepository: IProjectAuditLogRepository
  ) {}

  async execute(input: UpdateProjectInput, context: RequestContext): Promise<ProjectEntity> {
    const existingProject = await this.projectRepository.findById(input.id);
    if (!existingProject) {
      throw new NotFoundError("Project not found");
    }

    if (input.slug && input.slug !== existingProject.slug) {
      const slugExists = await this.projectRepository.existsBySlug(input.slug, input.id);
      if (slugExists) {
        throw new ValidationError("A project with this slug already exists");
      }
    }

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.projectType !== undefined) updateData.projectType = input.projectType;
    if (input.logo !== undefined) updateData.logo = input.logo;
    if (input.icon !== undefined) updateData.icon = input.icon;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.metadata !== undefined) updateData.metadataJson = input.metadata;
    if (input.databaseUrl !== undefined) {
      updateData.databaseUrl = this.encryptionService.encrypt(input.databaseUrl);
    }

    const updatedProject = await this.projectRepository.update(input.id, updateData);

    await this.auditLogRepository.create({
      id: this.encryptionService.generateSecureId(),
      organizationId: input.id,
      userId: context.userId,
      action: "updated",
      entityType: "project",
      entityId: input.id,
      oldValues: {
        name: existingProject.name,
        slug: existingProject.slug,
        description: existingProject.description,
        projectType: existingProject.projectType,
      },
      newValues: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        projectType: input.projectType,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger.info("Project updated", {
      projectId: input.id,
      changes: Object.keys(updateData),
      userId: context.userId,
    });

    return updatedProject;
  }
}
