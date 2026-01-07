import { logger } from "@/lib/utils/logger";
import { DATABASE_CONFIG } from "@/lib/constants";
import type {
  IProjectRepository,
  ProjectFilters,
} from "@/lib/core/domain/interfaces/project.repository.interface";
import type { ProjectEntity } from "@/lib/core/domain/entities/project.entity";

export class ListProjectsUseCase {
  constructor(private readonly projectRepository: IProjectRepository) {}

  async execute(
    filters: ProjectFilters,
    userId: string
  ): Promise<{ projects: ProjectEntity[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const result = await this.projectRepository.findAll(filters);

    const sanitizedProjects = result.data.map((project) => ({
      ...project,
      databaseUrl: project.databaseUrl ? DATABASE_CONFIG.ENCRYPTED_PLACEHOLDER : null,
    }));

    logger.info("Retrieved projects list", {
      count: result.data.length,
      userId,
    });

    return {
      projects: sanitizedProjects,
      pagination: result.pagination,
    };
  }
}
