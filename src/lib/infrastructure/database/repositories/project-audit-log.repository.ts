import { eq, and, desc, gte, lte, count as drizzleCount } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectAuditLog } from "@/lib/infrastructure/database/schemas";
import { logger } from "@/lib/utils/logger";
import type {
  IProjectAuditLogRepository,
  AuditLogFilters,
  PaginationResult,
  CreateAuditLogData,
} from "@/lib/core/domain/interfaces/project.repository.interface";
import type { ProjectAuditLogEntity } from "@/lib/core/domain/entities/project.entity";

export class ProjectAuditLogRepository implements IProjectAuditLogRepository {
  async create(data: CreateAuditLogData): Promise<ProjectAuditLogEntity> {
    try {
      const [auditLog] = await db
        .insert(projectAuditLog)
        .values({
          id: data.id,
          organizationId: data.organizationId,
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          oldValues: data.oldValues || null,
          newValues: data.newValues || null,
          metadata: data.metadata || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          createdAt: new Date(),
        })
        .returning();

      // Type casting to match the entity type
      return {
        id: auditLog.id,
        organizationId: auditLog.organizationId,
        userId: auditLog.userId,
        action: auditLog.action,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        oldValues: auditLog.oldValues as Record<string, unknown> | null,
        newValues: auditLog.newValues as Record<string, unknown> | null,
        metadata: auditLog.metadata as Record<string, unknown> | null,
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
        createdAt: auditLog.createdAt,
      };
    } catch (error) {
      logger.error("Failed to create audit log", { error, data });
      throw error;
    }
  }

  async findByOrganizationId(
    filters: AuditLogFilters
  ): Promise<PaginationResult<ProjectAuditLogEntity>> {
    const { organizationId, page, limit, action, entityType, userId, startDate, endDate } =
      filters;
    const offset = (page - 1) * limit;

    const conditions = [eq(projectAuditLog.organizationId, organizationId)];

    if (action) conditions.push(eq(projectAuditLog.action, action));
    if (entityType) conditions.push(eq(projectAuditLog.entityType, entityType));
    if (userId) conditions.push(eq(projectAuditLog.userId, userId));
    if (startDate) conditions.push(gte(projectAuditLog.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(projectAuditLog.createdAt, new Date(endDate)));

    const [{ count: totalCount }] = await db
      .select({ count: drizzleCount() })
      .from(projectAuditLog)
      .where(and(...conditions));

    const logs = await db
      .select()
      .from(projectAuditLog)
      .where(and(...conditions))
      .orderBy(desc(projectAuditLog.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: logs.map(log => ({
        id: log.id,
        organizationId: log.organizationId,
        userId: log.userId,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        oldValues: log.oldValues as Record<string, unknown> | null,
        newValues: log.newValues as Record<string, unknown> | null,
        metadata: log.metadata as Record<string, unknown> | null,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      })),
      pagination: {
        page,
        limit,
        total: Number(totalCount),
        totalPages: Math.ceil(Number(totalCount) / limit),
      },
    };
  }
}
