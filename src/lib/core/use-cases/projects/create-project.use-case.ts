import { ValidationError } from "@/lib/utils/error-handler";
import { logger } from "@/lib/utils/logger";
import type { IProjectRepository } from "@/lib/core/domain/interfaces/project.repository.interface";
import type { IEncryptionService } from "@/lib/core/domain/interfaces/encryption.service.interface";
import type { IProjectAuditLogRepository } from "@/lib/core/domain/interfaces/project.repository.interface";
import type { ProjectEntity } from "@/lib/core/domain/entities/project.entity";

export interface CreateProjectInput {
  name: string;
  slug: string;
  description?: string;
  projectType?: string;
  databaseUrl: string;
  logo?: string | null;
  icon?: string;
  color?: string;
  status?: "active" | "inactive" | "archived";
  metadata?: Record<string, unknown>;
}

export interface RequestContext {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

export class CreateProjectUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly encryptionService: IEncryptionService,
    private readonly auditLogRepository: IProjectAuditLogRepository
  ) {}

  async execute(input: CreateProjectInput, context: RequestContext): Promise<ProjectEntity> {
    const slugExists = await this.projectRepository.existsBySlug(input.slug);
    if (slugExists) {
      throw new ValidationError("A project with this slug already exists");
    }

    const encryptedDatabaseUrl = this.encryptionService.encrypt(input.databaseUrl);
    const projectId = this.encryptionService.generateSecureId();

    const project = await this.projectRepository.create({
      id: projectId,
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      projectType: input.projectType || null,
      databaseUrl: encryptedDatabaseUrl,
      logo: input.logo || null,
      icon: input.icon || null,
      color: input.color || null,
      status: input.status || "active",
      metadataJson: input.metadata || null,
    });

    await this.auditLogRepository.create({
      id: this.encryptionService.generateSecureId(),
      organizationId: projectId,
      userId: context.userId,
      action: "created",
      entityType: "project",
      entityId: projectId,
      newValues: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        projectType: input.projectType,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger.info("Project created", {
      projectId,
      name: project.name,
      slug: project.slug,
      userId: context.userId,
    });

    return project;
  }
}
