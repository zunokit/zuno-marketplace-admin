import {
  eq,
  and,
  desc,
  ilike,
  count as drizzleCount,
  isNull,
  sql,
} from "drizzle-orm";
import { db } from "@/lib/db";
import { projectTemplate } from "@/lib/infrastructure/database/schemas";
import type {
  ITemplateRepository,
  TemplateFilters,
  PaginationResult,
  CreateTemplateData,
  UpdateTemplateData,
} from "@/lib/core/domain/interfaces/template.repository.interface";
import type { ProjectTemplate } from "@/lib/infrastructure/database/schemas";

export class TemplateRepository implements ITemplateRepository {
  async findById(id: string): Promise<ProjectTemplate | null> {
    const [template] = await db
      .select()
      .from(projectTemplate)
      .where(and(eq(projectTemplate.id, id), isNull(projectTemplate.deletedAt)))
      .limit(1);

    return template || null;
  }

  async findBySlug(slug: string): Promise<ProjectTemplate | null> {
    const [template] = await db
      .select()
      .from(projectTemplate)
      .where(and(eq(projectTemplate.slug, slug), isNull(projectTemplate.deletedAt)))
      .limit(1);

    return template || null;
  }

  async findAll(
    filters: TemplateFilters
  ): Promise<PaginationResult<ProjectTemplate>> {
    const { page, limit, search, category, isPublic } = filters;
    const offset = (page - 1) * limit;

    const conditions = [isNull(projectTemplate.deletedAt)];

    if (search) {
      conditions.push(ilike(projectTemplate.name, `%${search}%`));
    }

    if (category) {
      conditions.push(eq(projectTemplate.category, category));
    }

    if (isPublic !== undefined) {
      conditions.push(eq(projectTemplate.isPublic, isPublic));
    }

    const [{ count: totalCount }] = await db
      .select({ count: drizzleCount() })
      .from(projectTemplate)
      .where(and(...conditions));

    const templates = await db
      .select()
      .from(projectTemplate)
      .where(and(...conditions))
      .orderBy(desc(projectTemplate.usageCount), desc(projectTemplate.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: templates,
      pagination: {
        page,
        limit,
        total: Number(totalCount),
        totalPages: Math.ceil(Number(totalCount) / limit),
      },
    };
  }

  async findPublicTemplates(): Promise<ProjectTemplate[]> {
    return await db
      .select()
      .from(projectTemplate)
      .where(
        and(
          eq(projectTemplate.isPublic, true),
          isNull(projectTemplate.deletedAt)
        )
      )
      .orderBy(desc(projectTemplate.usageCount));
  }

  async create(data: CreateTemplateData): Promise<ProjectTemplate> {
    const [template] = await db
      .insert(projectTemplate)
      .values({
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        icon: data.icon || null,
        color: data.color || null,
        category: data.category || "custom",
        defaultProjectType: data.defaultProjectType || null,
        defaultFeatures: data.defaultFeatures || null,
        defaultConfiguration: data.defaultConfiguration || null,
        defaultEnvironments: data.defaultEnvironments || null,
        isPublic: data.isPublic ?? true,
        isSystem: data.isSystem ?? false,
        createdBy: data.createdBy || null,
        version: data.version || "1.0.0",
        usageCount: 0,
      })
      .returning();

    return template;
  }

  async update(
    id: string,
    data: UpdateTemplateData
  ): Promise<ProjectTemplate> {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.defaultProjectType !== undefined)
      updateData.defaultProjectType = data.defaultProjectType;
    if (data.defaultFeatures !== undefined)
      updateData.defaultFeatures = data.defaultFeatures;
    if (data.defaultConfiguration !== undefined)
      updateData.defaultConfiguration = data.defaultConfiguration;
    if (data.defaultEnvironments !== undefined)
      updateData.defaultEnvironments = data.defaultEnvironments;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
    if (data.version !== undefined) updateData.version = data.version;

    const [updated] = await db
      .update(projectTemplate)
      .set(updateData)
      .where(eq(projectTemplate.id, id))
      .returning();

    return updated;
  }

  async delete(id: string): Promise<void> {
    await db
      .update(projectTemplate)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(projectTemplate.id, id));
  }

  async incrementUsageCount(id: string): Promise<void> {
    await db
      .update(projectTemplate)
      .set({
        usageCount: sql`${projectTemplate.usageCount} + 1`,
      })
      .where(eq(projectTemplate.id, id));
  }
}
