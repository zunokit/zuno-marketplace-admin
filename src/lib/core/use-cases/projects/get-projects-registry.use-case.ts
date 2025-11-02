import { logger } from "@/lib/utils/logger";
import type { IProjectRepository } from "@/lib/core/domain/interfaces/project.repository.interface";
import type { IEncryptionService } from "@/lib/core/domain/interfaces/encryption.service.interface";

export interface ProjectRegistryConfig {
  id: string;
  name: string;
  slug: string;
  databaseUrl: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
}

export class GetProjectsRegistryUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly encryptionService: IEncryptionService
  ) {}

  async execute(userId: string): Promise<Record<string, ProjectRegistryConfig>> {
    const projects = await this.projectRepository.findActiveProjects();

    const registry: Record<string, ProjectRegistryConfig> = {};

    for (const project of projects) {
      const decryptedDatabaseUrl = project.databaseUrl
        ? this.encryptionService.decrypt(project.databaseUrl)
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

    logger.debug("Retrieved projects registry", {
      projectCount: Object.keys(registry).length,
      userId,
    });

    return registry;
  }
}
