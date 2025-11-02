import { ValidationError, NotFoundError } from "@/lib/utils/error-handler";
import { logger } from "@/lib/utils/logger";
import type { IProjectRepository } from "@/lib/core/domain/interfaces/project.repository.interface";
import type { ITemplateRepository } from "@/lib/core/domain/interfaces/template.repository.interface";
import type { IEncryptionService } from "@/lib/core/domain/interfaces/encryption.service.interface";
import type { IProjectAuditLogRepository } from "@/lib/core/domain/interfaces/project.repository.interface";
import type { ProjectEntity } from "@/lib/core/domain/entities/project.entity";
import type { RequestContext } from "./create-project.use-case";

export interface CreateFromTemplateInput {
  templateId: string;
  name: string;
  slug: string;
  description?: string;
  databaseUrl: string;
  icon?: string;
  color?: string;
}

export class CreateFromTemplateUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly templateRepository: ITemplateRepository,
    private readonly encryptionService: IEncryptionService,
    private readonly auditLogRepository: IProjectAuditLogRepository
  ) {}

  async execute(
    input: CreateFromTemplateInput,
    context: RequestContext
  ): Promise<ProjectEntity> {
    // Validate template exists
    const template = await this.templateRepository.findById(input.templateId);
    if (!template) {
      throw new NotFoundError("Template not found");
    }

    // Validate slug is available
    const slugExists = await this.projectRepository.existsBySlug(input.slug);
    if (slugExists) {
      throw new ValidationError("A project with this slug already exists");
    }

    const encryptedDatabaseUrl = this.encryptionService.encrypt(
      input.databaseUrl
    );
    const projectId = this.encryptionService.generateSecureId();

    // Create project using template defaults
    const project = await this.projectRepository.create({
      id: projectId,
      name: input.name,
      slug: input.slug,
      description: input.description || template.description || null,
      projectType: template.defaultProjectType || null,
      databaseUrl: encryptedDatabaseUrl,
      icon: input.icon || template.icon || null,
      color: input.color || template.color || null,
      status: "active",
      metadataJson: template.defaultConfiguration || null,
    });

    // Increment template usage count
    await this.templateRepository.incrementUsageCount(input.templateId);

    // Create audit log
    await this.auditLogRepository.create({
      id: this.encryptionService.generateSecureId(),
      organizationId: projectId,
      userId: context.userId,
      action: "created_from_template",
      entityType: "project",
      entityId: projectId,
      newValues: {
        name: input.name,
        slug: input.slug,
        templateId: input.templateId,
        templateName: template.name,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger.info("Project created from template", {
      projectId,
      name: project.name,
      slug: project.slug,
      templateId: input.templateId,
      templateName: template.name,
      userId: context.userId,
    });

    return project;
  }
}
