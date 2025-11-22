import { eq, and, desc, ilike, count as drizzleCount } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projectFeature } from '@/lib/infrastructure/database/schemas';
import type { IFeatureFlagRepository } from '@/lib/core/domain/interfaces/feature-flag.repository.interface';
import type { FeatureFlagEntity } from '@/lib/core/domain/entities/feature-flag.entity';
import type {
  CreateFeatureFlagData,
  UpdateFeatureFlagData,
  FeatureFlagFilters,
  PaginationResult,
} from '@/lib/core/domain/interfaces/feature-flag.repository.interface';

export class FeatureFlagRepository implements IFeatureFlagRepository {
  private mapToEntity(dbRow: typeof projectFeature.$inferSelect): FeatureFlagEntity {
    return {
      id: dbRow.id,
      organizationId: dbRow.organizationId,
      name: dbRow.name,
      key: dbRow.key,
      description: dbRow.description,
      isEnabled: dbRow.isEnabled,
      configuration: dbRow.configuration as Record<string, unknown> | null,
      createdAt: dbRow.createdAt,
      updatedAt: dbRow.updatedAt,
    };
  }

  async findById(id: string): Promise<FeatureFlagEntity | null> {
    const [flag] = await db
      .select()
      .from(projectFeature)
      .where(eq(projectFeature.id, id))
      .limit(1);

    return flag ? this.mapToEntity(flag) : null;
  }

  async findByKey(organizationId: string, key: string): Promise<FeatureFlagEntity | null> {
    const [flag] = await db
      .select()
      .from(projectFeature)
      .where(
        and(eq(projectFeature.organizationId, organizationId), eq(projectFeature.key, key))
      )
      .limit(1);

    return flag ? this.mapToEntity(flag) : null;
  }

  async findByOrganization(
    organizationId: string,
    filters: FeatureFlagFilters
  ): Promise<PaginationResult<FeatureFlagEntity>> {
    const { page, limit, search, isEnabled } = filters;
    const offset = (page - 1) * limit;

    const conditions = [eq(projectFeature.organizationId, organizationId)];

    if (search) {
      conditions.push(ilike(projectFeature.name, `%${search}%`));
    }

    if (isEnabled !== undefined) {
      conditions.push(eq(projectFeature.isEnabled, isEnabled));
    }

    const [{ count: totalCount }] = await db
      .select({ count: drizzleCount() })
      .from(projectFeature)
      .where(and(...conditions));

    const flags = await db
      .select()
      .from(projectFeature)
      .where(and(...conditions))
      .orderBy(desc(projectFeature.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: flags.map((flag) => this.mapToEntity(flag)),
      pagination: {
        page,
        limit,
        total: Number(totalCount),
        totalPages: Math.ceil(Number(totalCount) / limit),
      },
    };
  }

  async findEnabledByOrganization(organizationId: string): Promise<FeatureFlagEntity[]> {
    const flags = await db
      .select()
      .from(projectFeature)
      .where(
        and(
          eq(projectFeature.organizationId, organizationId),
          eq(projectFeature.isEnabled, true)
        )
      );

    return flags.map((flag) => this.mapToEntity(flag));
  }

  async create(data: CreateFeatureFlagData): Promise<FeatureFlagEntity> {
    const [flag] = await db
      .insert(projectFeature)
      .values({
        id: data.id,
        organizationId: data.organizationId,
        name: data.name,
        key: data.key,
        description: data.description || null,
        isEnabled: data.isEnabled ?? false,
        configuration: data.configuration || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return this.mapToEntity(flag);
  }

  async update(id: string, data: UpdateFeatureFlagData): Promise<FeatureFlagEntity> {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;
    if (data.configuration !== undefined) updateData.configuration = data.configuration;

    const [updated] = await db
      .update(projectFeature)
      .set(updateData)
      .where(eq(projectFeature.id, id))
      .returning();

    return this.mapToEntity(updated);
  }

  async toggle(id: string): Promise<FeatureFlagEntity> {
    // Get current state
    const current = await this.findById(id);
    if (!current) {
      throw new Error('Feature flag not found');
    }

    // Toggle
    const [updated] = await db
      .update(projectFeature)
      .set({
        isEnabled: !current.isEnabled,
        updatedAt: new Date(),
      })
      .where(eq(projectFeature.id, id))
      .returning();

    return this.mapToEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await db.delete(projectFeature).where(eq(projectFeature.id, id));
  }

  async isEnabled(organizationId: string, key: string): Promise<boolean> {
    const flag = await this.findByKey(organizationId, key);
    return flag?.isEnabled ?? false;
  }

  async bulkToggle(ids: string[], isEnabled: boolean): Promise<number> {
    // Update each feature flag individually
    let count = 0;
    for (const id of ids) {
      await db
        .update(projectFeature)
        .set({
          isEnabled,
          updatedAt: new Date(),
        })
        .where(eq(projectFeature.id, id));
      count++;
    }
    return count;
  }
}
