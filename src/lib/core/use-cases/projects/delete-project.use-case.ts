import { NotFoundError } from "@/lib/utils/error-handler";
import { logger } from "@/lib/utils/logger";
import type { IProjectRepository } from "@/lib/core/domain/interfaces/project.repository.interface";
import type { IEncryptionService } from "@/lib/core/domain/interfaces/encryption.service.interface";
import type { IProjectAuditLogRepository } from "@/lib/core/domain/interfaces/project.repository.interface";
import type { RequestContext } from "./create-project.use-case";

export class DeleteProjectUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly encryptionService: IEncryptionService,
    private readonly auditLogRepository: IProjectAuditLogRepository
  ) {}

  async execute(projectId: string, context: RequestContext): Promise<void> {
    const existingProject = await this.projectRepository.findById(projectId);
    if (!existingProject) {
      throw new NotFoundError("Project not found");
    }

    // Soft delete instead of hard delete
    await this.projectRepository.softDelete(projectId, context.userId);

    await this.auditLogRepository.create({
      id: this.encryptionService.generateSecureId(),
      organizationId: projectId,
      userId: context.userId,
      action: "soft_deleted",
      entityType: "project",
      entityId: projectId,
      oldValues: {
        name: existingProject.name,
        slug: existingProject.slug,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger.warn("Project soft deleted", {
      projectId,
      projectName: existingProject.name,
      userId: context.userId,
      deletedBy: context.userId,
    });
  }
}
