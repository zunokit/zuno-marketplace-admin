import type { ProjectTemplate } from "@/lib/infrastructure/database/schemas";

export interface TemplateFilters {
  category?: string;
  isPublic?: boolean;
  search?: string;
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

export interface CreateTemplateData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  category?: string;
  defaultProjectType?: string | null;
  defaultFeatures?: string[] | null;
  defaultConfiguration?: Record<string, unknown> | null;
  defaultEnvironments?: Array<{
    name: string;
    slug: string;
    description: string;
  }> | null;
  isPublic?: boolean;
  isSystem?: boolean;
  createdBy?: string | null;
  version?: string;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  category?: string;
  defaultProjectType?: string | null;
  defaultFeatures?: string[] | null;
  defaultConfiguration?: Record<string, unknown> | null;
  defaultEnvironments?: Array<{
    name: string;
    slug: string;
    description: string;
  }> | null;
  isPublic?: boolean;
  version?: string;
}

export interface ITemplateRepository {
  findById(id: string): Promise<ProjectTemplate | null>;
  findBySlug(slug: string): Promise<ProjectTemplate | null>;
  findAll(filters: TemplateFilters): Promise<PaginationResult<ProjectTemplate>>;
  findPublicTemplates(): Promise<ProjectTemplate[]>;
  create(data: CreateTemplateData): Promise<ProjectTemplate>;
  update(id: string, data: UpdateTemplateData): Promise<ProjectTemplate>;
  delete(id: string): Promise<void>;
  incrementUsageCount(id: string): Promise<void>;
}
