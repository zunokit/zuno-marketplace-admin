import { ProjectRepository } from "@/lib/infrastructure/database/repositories/project.repository";
import { ProjectEnvironmentRepository } from "@/lib/infrastructure/database/repositories/project-environment.repository";
import { ProjectAuditLogRepository } from "@/lib/infrastructure/database/repositories/project-audit-log.repository";
import { EncryptionService } from "@/lib/infrastructure/external/encryption.service";
import { CreateProjectUseCase } from "@/lib/core/use-cases/projects/create-project.use-case";
import { UpdateProjectUseCase } from "@/lib/core/use-cases/projects/update-project.use-case";
import { DeleteProjectUseCase } from "@/lib/core/use-cases/projects/delete-project.use-case";
import { GetProjectUseCase } from "@/lib/core/use-cases/projects/get-project.use-case";
import { ListProjectsUseCase } from "@/lib/core/use-cases/projects/list-projects.use-case";
import { TestProjectConnectionUseCase } from "@/lib/core/use-cases/projects/test-project-connection.use-case";
import { GetProjectsRegistryUseCase } from "@/lib/core/use-cases/projects/get-projects-registry.use-case";

class DIContainer {
  private static instance: DIContainer;

  private _projectRepository?: ProjectRepository;
  private _projectEnvironmentRepository?: ProjectEnvironmentRepository;
  private _projectAuditLogRepository?: ProjectAuditLogRepository;
  private _encryptionService?: EncryptionService;

  private constructor() {}

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  get projectRepository(): ProjectRepository {
    if (!this._projectRepository) {
      this._projectRepository = new ProjectRepository();
    }
    return this._projectRepository;
  }

  get projectEnvironmentRepository(): ProjectEnvironmentRepository {
    if (!this._projectEnvironmentRepository) {
      this._projectEnvironmentRepository = new ProjectEnvironmentRepository();
    }
    return this._projectEnvironmentRepository;
  }

  get projectAuditLogRepository(): ProjectAuditLogRepository {
    if (!this._projectAuditLogRepository) {
      this._projectAuditLogRepository = new ProjectAuditLogRepository();
    }
    return this._projectAuditLogRepository;
  }

  get encryptionService(): EncryptionService {
    if (!this._encryptionService) {
      this._encryptionService = new EncryptionService();
    }
    return this._encryptionService;
  }

  createProjectUseCase(): CreateProjectUseCase {
    return new CreateProjectUseCase(
      this.projectRepository,
      this.encryptionService,
      this.projectAuditLogRepository
    );
  }

  updateProjectUseCase(): UpdateProjectUseCase {
    return new UpdateProjectUseCase(
      this.projectRepository,
      this.encryptionService,
      this.projectAuditLogRepository
    );
  }

  deleteProjectUseCase(): DeleteProjectUseCase {
    return new DeleteProjectUseCase(
      this.projectRepository,
      this.encryptionService,
      this.projectAuditLogRepository
    );
  }

  getProjectUseCase(): GetProjectUseCase {
    return new GetProjectUseCase(
      this.projectRepository,
      this.encryptionService
    );
  }

  listProjectsUseCase(): ListProjectsUseCase {
    return new ListProjectsUseCase(this.projectRepository);
  }

  testProjectConnectionUseCase(): TestProjectConnectionUseCase {
    return new TestProjectConnectionUseCase();
  }

  getProjectsRegistryUseCase(): GetProjectsRegistryUseCase {
    return new GetProjectsRegistryUseCase(
      this.projectRepository,
      this.encryptionService
    );
  }
}

export const container = DIContainer.getInstance();
