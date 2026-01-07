import type { ProjectApiKey } from "@/lib/infrastructure/database/schemas";

export interface ApiKeyFilters {
  organizationId: string;
  isActive?: boolean;
  environmentId?: string;
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateApiKeyData {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  keyHash: string;
  keyPrefix: string;
  scopes: string[];
  environmentId?: string | null;
  expiresAt?: Date | null;
  createdBy: string;
}

export interface UpdateApiKeyData {
  name?: string;
  description?: string | null;
  scopes?: string[];
  isActive?: boolean;
}

export interface RevokeApiKeyData {
  revokedBy: string;
  revokedReason?: string | null;
}

export interface IApiKeyRepository {
  findById(id: string): Promise<ProjectApiKey | null>;
  findByKeyHash(keyHash: string): Promise<ProjectApiKey | null>;
  findByOrganization(
    filters: ApiKeyFilters
  ): Promise<PaginationResult<ProjectApiKey>>;
  findActiveByOrganization(organizationId: string): Promise<ProjectApiKey[]>;
  create(data: CreateApiKeyData): Promise<ProjectApiKey>;
  update(id: string, data: UpdateApiKeyData): Promise<ProjectApiKey>;
  revoke(id: string, data: RevokeApiKeyData): Promise<ProjectApiKey>;
  updateLastUsed(id: string, ipAddress: string): Promise<void>;
}
