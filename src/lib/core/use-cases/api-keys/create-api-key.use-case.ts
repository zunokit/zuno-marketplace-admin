import { NotFoundError } from "@/lib/utils/error-handler";
import { logger } from "@/lib/utils/logger";
import type { IProjectRepository } from "@/lib/core/domain/interfaces/project.repository.interface";
import type { IApiKeyRepository } from "@/lib/core/domain/interfaces/api-key.repository.interface";
import type { IEncryptionService } from "@/lib/core/domain/interfaces/encryption.service.interface";
import type { ApiKeyService } from "@/lib/core/services/api-key.service";
import type { ProjectApiKey } from "@/lib/infrastructure/database/schemas";

export interface CreateApiKeyInput {
  organizationId: string;
  name: string;
  description?: string;
  scopes: string[];
  environmentId?: string;
  expiresAt?: Date;
}

export interface CreateApiKeyOutput {
  apiKey: ProjectApiKey;
  plainKey: string; // Only returned once!
}

export class CreateApiKeyUseCase {
  constructor(
    private readonly apiKeyRepository: IApiKeyRepository,
    private readonly projectRepository: IProjectRepository,
    private readonly apiKeyService: ApiKeyService,
    private readonly encryptionService: IEncryptionService
  ) {}

  async execute(
    input: CreateApiKeyInput,
    userId: string
  ): Promise<CreateApiKeyOutput> {
    // Validate project exists
    const project = await this.projectRepository.findById(
      input.organizationId
    );
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    // Generate secure API key
    const { key, keyHash, keyPrefix } =
      await this.apiKeyService.generateApiKey();

    // Create API key record
    const apiKey = await this.apiKeyRepository.create({
      id: this.encryptionService.generateSecureId(),
      organizationId: input.organizationId,
      name: input.name,
      description: input.description || null,
      keyHash,
      keyPrefix,
      scopes: input.scopes,
      environmentId: input.environmentId || null,
      expiresAt: input.expiresAt || null,
      createdBy: userId,
    });

    logger.info("API key created", {
      apiKeyId: apiKey.id,
      name: apiKey.name,
      organizationId: input.organizationId,
      userId,
      scopes: input.scopes,
    });

    // Return the plaintext key ONCE (never stored)
    return {
      apiKey,
      plainKey: key,
    };
  }
}
