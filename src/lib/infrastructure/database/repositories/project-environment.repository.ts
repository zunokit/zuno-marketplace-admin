import { eq, and, desc, ilike, count as drizzleCount } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectEnvironment } from "@/lib/infrastructure/database/schemas";
import type {
  IProjectEnvironmentRepository,
  ProjectEnvironmentFilters,
  PaginationResult,
  CreateEnvironmentData,
  UpdateEnvironmentData,
} from "@/lib/core/domain/interfaces/project.repository.interface";
import type { ProjectEnvironmentEntity } from "@/lib/core/domain/entities/project.entity";

export class ProjectEnvironmentRepository implements IProjectEnvironmentRepository {
  async findById(id: string): Promise<ProjectEnvironmentEntity | null> {
    const [environment] = await db
      .select()
      .from(projectEnvironment)
      .where(eq(projectEnvironment.id, id))
      .limit(1);

    return environment || null;
  }

  async findByOrganizationId(
    filters: ProjectEnvironmentFilters
  ): Promise<PaginationResult<ProjectEnvironmentEntity>> {
    const { organizationId, page, limit, search, isActive } = filters;
    const offset = (page - 1) * limit;

    const conditions = [eq(projectEnvironment.organizationId, organizationId)];

    if (search) {
      conditions.push(ilike(projectEnvironment.name, `%${search}%`));
    }

    if (isActive !== undefined) {
      conditions.push(eq(projectEnvironment.isActive, isActive));
    }

    const [{ count: totalCount }] = await db
      .select({ count: drizzleCount() })
      .from(projectEnvironment)
      .where(and(...conditions));

    const environments = await db
      .select()
      .from(projectEnvironment)
      .where(and(...conditions))
      .orderBy(desc(projectEnvironment.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: environments,
      pagination: {
        page,
        limit,
        total: Number(totalCount),
        totalPages: Math.ceil(Number(totalCount) / limit),
      },
    };
  }

  async create(data: CreateEnvironmentData): Promise<ProjectEnvironmentEntity> {
    const [environment] = await db
      .insert(projectEnvironment)
      .values({
        id: data.id,
        organizationId: data.organizationId,
        name: data.name,
        slug: data.slug,
        databaseUrl: data.databaseUrl,
        description: data.description || null,
        isActive: data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return environment;
  }

  async update(id: string, data: UpdateEnvironmentData): Promise<ProjectEnvironmentEntity> {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.databaseUrl !== undefined) updateData.databaseUrl = data.databaseUrl;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updated] = await db
      .update(projectEnvironment)
      .set(updateData)
      .where(eq(projectEnvironment.id, id))
      .returning();

    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.delete(projectEnvironment).where(eq(projectEnvironment.id, id));
  }
}
