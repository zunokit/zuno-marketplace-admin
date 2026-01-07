import { NotFoundError } from "@/lib/utils/error-handler";
import { logger } from "@/lib/utils/logger";
import type { IProjectRepository } from "@/lib/core/domain/interfaces/project.repository.interface";
import type { IEncryptionService } from "@/lib/core/domain/interfaces/encryption.service.interface";
import type { ProjectEntity } from "@/lib/core/domain/entities/project.entity";

export class GetProjectUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly encryptionService: IEncryptionService
  ) {}

  async execute(projectId: string, userId: string): Promise<ProjectEntity> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    if (project.databaseUrl) {
      project.databaseUrl = this.encryptionService.decrypt(project.databaseUrl);
    }

    logger.info("Retrieved project details", { projectId, userId });

    return project;
  }
}
