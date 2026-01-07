export interface ProjectEntity {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  projectType: string | null;
  databaseUrl: string | null;
  status: string;
  icon: string | null;
  color: string | null;
  logo: string | null;
  metadata: string | null;
  metadataJson: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectEnvironmentEntity {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  databaseUrl: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectAuditLogEntity {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}
