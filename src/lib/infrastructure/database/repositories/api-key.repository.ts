import { eq, and, desc, count as drizzleCount, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectApiKey } from "@/lib/infrastructure/database/schemas/auth.schema";
import type {
  IApiKeyRepository,
  ApiKeyFilters,
  PaginationResult,
  CreateApiKeyData,
  UpdateApiKeyData,
  RevokeApiKeyData,
} from "@/lib/core/domain/interfaces/api-key.repository.interface";
import type { ProjectApiKey } from "@/lib/infrastructure/database/schemas/auth.schema";

export class ApiKeyRepository implements IApiKeyRepository {
  async findById(id: string): Promise<ProjectApiKey | null> {
    const [apiKey] = await db
      .select()
      .from(projectApiKey)
      .where(eq(projectApiKey.id, id))
      .limit(1);

    return apiKey || null;
  }

  async findByKeyHash(keyHash: string): Promise<ProjectApiKey | null> {
    const [apiKey] = await db
      .select()
      .from(projectApiKey)
      .where(
        and(
          eq(projectApiKey.keyHash, keyHash),
          eq(projectApiKey.isActive, true),
          isNull(projectApiKey.revokedAt)
        )
      )
      .limit(1);

    return apiKey || null;
  }

  async findByOrganization(
    filters: ApiKeyFilters
  ): Promise<PaginationResult<ProjectApiKey>> {
    const { page, limit, organizationId, isActive, environmentId } = filters;
    const offset = (page - 1) * limit;

    const conditions = [eq(projectApiKey.organizationId, organizationId)];

    if (isActive !== undefined) {
      conditions.push(eq(projectApiKey.isActive, isActive));
    }

    if (environmentId) {
      conditions.push(eq(projectApiKey.environmentId, environmentId));
    }

    const [{ count: totalCount }] = await db
      .select({ count: drizzleCount() })
      .from(projectApiKey)
      .where(and(...conditions));

    const apiKeys = await db
      .select()
      .from(projectApiKey)
      .where(and(...conditions))
      .orderBy(desc(projectApiKey.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: apiKeys,
      pagination: {
        page,
        limit,
        total: Number(totalCount),
        totalPages: Math.ceil(Number(totalCount) / limit),
      },
    };
  }

  async findActiveByOrganization(
    organizationId: string
  ): Promise<ProjectApiKey[]> {
    return await db
      .select()
      .from(projectApiKey)
      .where(
        and(
          eq(projectApiKey.organizationId, organizationId),
          eq(projectApiKey.isActive, true),
          isNull(projectApiKey.revokedAt)
        )
      )
      .orderBy(desc(projectApiKey.createdAt));
  }

  async create(data: CreateApiKeyData): Promise<ProjectApiKey> {
    const [apiKey] = await db
      .insert(projectApiKey)
      .values({
        id: data.id,
        organizationId: data.organizationId,
        name: data.name,
        description: data.description || null,
        keyHash: data.keyHash,
        keyPrefix: data.keyPrefix,
        scopes: data.scopes,
        environmentId: data.environmentId || null,
        expiresAt: data.expiresAt || null,
        createdBy: data.createdBy,
        isActive: true,
      })
      .returning();

    return apiKey;
  }

  async update(id: string, data: UpdateApiKeyData): Promise<ProjectApiKey> {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.scopes !== undefined) updateData.scopes = data.scopes;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updated] = await db
      .update(projectApiKey)
      .set(updateData)
      .where(eq(projectApiKey.id, id))
      .returning();

    return updated;
  }

  async revoke(id: string, data: RevokeApiKeyData): Promise<ProjectApiKey> {
    const [revoked] = await db
      .update(projectApiKey)
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokedBy: data.revokedBy,
        revokedReason: data.revokedReason || null,
        updatedAt: new Date(),
      })
      .where(eq(projectApiKey.id, id))
      .returning();

    return revoked;
  }

  async updateLastUsed(id: string, ipAddress: string): Promise<void> {
    await db
      .update(projectApiKey)
      .set({
        lastUsedAt: new Date(),
        lastUsedIp: ipAddress,
      })
      .where(eq(projectApiKey.id, id));
  }
}
