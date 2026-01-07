import type {
  ProjectEntity,
  ProjectEnvironmentEntity,
  ProjectAuditLogEntity,
} from "../entities/project.entity";

export interface ProjectFilters {
  search?: string;
  status?: string;
  projectType?: string;
  page: number;
  limit: number;
  sortBy?: "name" | "createdAt" | "updatedAt" | "status";
  sortOrder?: "asc" | "desc";
}

export interface ProjectEnvironmentFilters {
  organizationId: string;
  search?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}

export interface AuditLogFilters {
  organizationId: string;
  action?: string;
  entityType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
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

export interface CreateProjectData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  projectType?: string | null;
  databaseUrl?: string | null;
  status?: string;
  icon?: string | null;
  color?: string | null;
  logo?: string | null;
  metadataJson?: Record<string, unknown> | null;
}

export interface UpdateProjectData {
  name?: string;
  slug?: string;
  description?: string | null;
  projectType?: string | null;
  databaseUrl?: string | null;
  status?: string;
  icon?: string | null;
  color?: string | null;
  logo?: string | null;
  metadataJson?: Record<string, unknown> | null;
}

export interface CreateEnvironmentData {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  databaseUrl: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateEnvironmentData {
  name?: string;
  slug?: string;
  databaseUrl?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateAuditLogData {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface IProjectRepository {
  findById(id: string): Promise<ProjectEntity | null>;
  findBySlug(slug: string): Promise<ProjectEntity | null>;
  findAll(filters: ProjectFilters): Promise<PaginationResult<ProjectEntity>>;
  findActiveProjects(): Promise<ProjectEntity[]>;
  create(data: CreateProjectData): Promise<ProjectEntity>;
  update(id: string, data: UpdateProjectData): Promise<ProjectEntity>;
  delete(id: string): Promise<void>;
  existsBySlug(slug: string, excludeId?: string): Promise<boolean>;
  softDelete(id: string, deletedBy: string): Promise<void>;
  restore(id: string): Promise<ProjectEntity>;
  findDeleted(): Promise<ProjectEntity[]>;
}

export interface IProjectEnvironmentRepository {
  findById(id: string): Promise<ProjectEnvironmentEntity | null>;
  findByOrganizationId(
    filters: ProjectEnvironmentFilters
  ): Promise<PaginationResult<ProjectEnvironmentEntity>>;
  create(data: CreateEnvironmentData): Promise<ProjectEnvironmentEntity>;
  update(id: string, data: UpdateEnvironmentData): Promise<ProjectEnvironmentEntity>;
  delete(id: string): Promise<void>;
}

export interface IProjectAuditLogRepository {
  create(data: CreateAuditLogData): Promise<ProjectAuditLogEntity>;
  findByOrganizationId(
    filters: AuditLogFilters
  ): Promise<PaginationResult<ProjectAuditLogEntity>>;
}
