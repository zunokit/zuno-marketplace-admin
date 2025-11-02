import { eq, and, desc, asc, ilike, count as drizzleCount, isNull, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { organization } from "@/lib/infrastructure/database/schemas";
import type {
  IProjectRepository,
  ProjectFilters,
  PaginationResult,
  CreateProjectData,
  UpdateProjectData,
} from "@/lib/core/domain/interfaces/project.repository.interface";
import type { ProjectEntity } from "@/lib/core/domain/entities/project.entity";

export class ProjectRepository implements IProjectRepository {
  private mapToEntity(dbRow: typeof organization.$inferSelect): ProjectEntity {
    return {
      id: dbRow.id,
      name: dbRow.name,
      slug: dbRow.slug,
      description: dbRow.description,
      projectType: dbRow.projectType,
      databaseUrl: dbRow.databaseUrl,
      status: dbRow.status,
      icon: dbRow.icon,
      color: dbRow.color,
      logo: dbRow.logo,
      metadata: dbRow.metadata,
      metadataJson: dbRow.metadataJson as Record<string, unknown> | null,
      createdAt: dbRow.createdAt,
      updatedAt: dbRow.updatedAt,
    };
  }

  async findById(id: string): Promise<ProjectEntity | null> {
    const [project] = await db
      .select()
      .from(organization)
      .where(and(eq(organization.id, id), isNull(organization.deletedAt)))
      .limit(1);

    return project ? this.mapToEntity(project) : null;
  }

  async findBySlug(slug: string): Promise<ProjectEntity | null> {
    const [project] = await db
      .select()
      .from(organization)
      .where(and(eq(organization.slug, slug), isNull(organization.deletedAt)))
      .limit(1);

    return project ? this.mapToEntity(project) : null;
  }

  async findAll(filters: ProjectFilters): Promise<PaginationResult<ProjectEntity>> {
    const { page, limit, search, status, projectType, sortBy = "createdAt", sortOrder = "desc" } = filters;
    const offset = (page - 1) * limit;

    const conditions = [isNull(organization.deletedAt)];

    if (search) {
      conditions.push(ilike(organization.name, `%${search}%`));
    }

    if (status) {
      conditions.push(eq(organization.status, status));
    }

    if (projectType) {
      conditions.push(eq(organization.projectType, projectType));
    }

    const [{ count: totalCount }] = await db
      .select({ count: drizzleCount() })
      .from(organization)
      .where(and(...conditions));

    let orderBy;
    switch (sortBy) {
      case "name":
        orderBy = sortOrder === "desc" ? desc(organization.name) : asc(organization.name);
        break;
      case "createdAt":
        orderBy = sortOrder === "desc" ? desc(organization.createdAt) : asc(organization.createdAt);
        break;
      case "updatedAt":
        orderBy = sortOrder === "desc" ? desc(organization.updatedAt) : asc(organization.updatedAt);
        break;
      case "status":
        orderBy = sortOrder === "desc" ? desc(organization.status) : asc(organization.status);
        break;
      default:
        orderBy = desc(organization.createdAt);
    }

    const projects = await db
      .select()
      .from(organization)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      data: projects.map(project => this.mapToEntity(project)),
      pagination: {
        page,
        limit,
        total: Number(totalCount),
        totalPages: Math.ceil(Number(totalCount) / limit),
      },
    };
  }

  async findActiveProjects(): Promise<ProjectEntity[]> {
    const projects = await db
      .select()
      .from(organization)
      .where(and(eq(organization.status, "active"), isNull(organization.deletedAt)));

    return projects.map(project => this.mapToEntity(project));
  }

  async create(data: CreateProjectData): Promise<ProjectEntity> {
    const [project] = await db
      .insert(organization)
      .values({
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        projectType: data.projectType || null,
        databaseUrl: data.databaseUrl || null,
        status: data.status || "active",
        icon: data.icon || null,
        color: data.color || null,
        logo: data.logo || null,
        metadataJson: data.metadataJson || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return this.mapToEntity(project);
  }

  async update(id: string, data: UpdateProjectData): Promise<ProjectEntity> {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.projectType !== undefined) updateData.projectType = data.projectType;
    if (data.databaseUrl !== undefined) updateData.databaseUrl = data.databaseUrl;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.metadataJson !== undefined) updateData.metadataJson = data.metadataJson;

    const [updated] = await db
      .update(organization)
      .set(updateData)
      .where(eq(organization.id, id))
      .returning();

    return this.mapToEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await db.delete(organization).where(eq(organization.id, id));
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const conditions = [eq(organization.slug, slug), isNull(organization.deletedAt)];

    if (excludeId) {
      conditions.push(eq(organization.id, excludeId));
    }

    const [result] = await db
      .select({ id: organization.id })
      .from(organization)
      .where(and(...conditions))
      .limit(1);

    return !!result;
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await db
      .update(organization)
      .set({
        deletedAt: new Date(),
        deletedBy,
      })
      .where(eq(organization.id, id));
  }

  async restore(id: string): Promise<ProjectEntity> {
    const [restored] = await db
      .update(organization)
      .set({
        deletedAt: null,
        deletedBy: null,
      })
      .where(eq(organization.id, id))
      .returning();

    return this.mapToEntity(restored);
  }

  async findDeleted(): Promise<ProjectEntity[]> {
    const projects = await db
      .select()
      .from(organization)
      .where(isNotNull(organization.deletedAt));

    return projects.map(project => this.mapToEntity(project));
  }
}
