/**
 * React Query Configuration
 * Centralized configuration for TanStack Query with optimal defaults
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query'

/**
 * Default Query Client Options
 * Optimized for performance and user experience
 */
export const defaultQueryClientOptions: DefaultOptions = {
  queries: {
    // Caching Strategy
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh for 5 min
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime) - keep unused data in cache for 10 min

    // Refetch Strategy
    refetchOnWindowFocus: false, // Don't refetch on window focus (annoying in dev)
    refetchOnMount: true, // Refetch when component mounts if data is stale
    refetchOnReconnect: true, // Refetch when network reconnects

    // Retry Strategy
    retry: 1, // Retry failed requests once
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

    // Performance
    structuralSharing: true, // Enable structural sharing for better performance
  },
  mutations: {
    // Retry Strategy for Mutations
    retry: 0, // Don't retry mutations by default (they should be idempotent if retry needed)

    // Network Mode
    networkMode: 'online', // Only run mutations when online
  },
}

/**
 * Create Query Client with optimal configuration
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: defaultQueryClientOptions,
  })
}

/**
 * Query Keys Factory
 * Centralized query key management for better organization and type safety
 */
export const queryKeys = {
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    stats: (id: string) => [...queryKeys.projects.detail(id), 'stats'] as const,
  },

  // Members
  members: {
    all: ['members'] as const,
    lists: () => [...queryKeys.members.all, 'list'] as const,
    list: (projectId: string) => [...queryKeys.members.lists(), projectId] as const,
    detail: (projectId: string, userId: string) => [...queryKeys.members.lists(), projectId, userId] as const,
  },

  // Invitations
  invitations: {
    all: ['invitations'] as const,
    lists: () => [...queryKeys.invitations.all, 'list'] as const,
    list: (projectId: string) => [...queryKeys.invitations.lists(), projectId] as const,
    detail: (invitationId: string) => [...queryKeys.invitations.all, invitationId] as const,
  },

  // Tables & Data
  tables: {
    all: ['tables'] as const,
    lists: () => [...queryKeys.tables.all, 'list'] as const,
    list: (projectId: string) => [...queryKeys.tables.lists(), projectId] as const,
    detail: (projectId: string, tableName: string) => [...queryKeys.tables.lists(), projectId, tableName] as const,
    data: (projectId: string, tableName: string, page?: number, limit?: number) =>
      [...queryKeys.tables.detail(projectId, tableName), 'data', { page, limit }] as const,
  },

  // Schema
  schema: {
    all: ['schema'] as const,
    detail: (projectId: string) => [...queryKeys.schema.all, projectId] as const,
    explorer: (projectId: string) => [...queryKeys.schema.detail(projectId), 'explorer'] as const,
    graph: (projectId: string) => [...queryKeys.schema.detail(projectId), 'graph'] as const,
  },

  // Queries (SQL)
  queries: {
    all: ['queries'] as const,
    history: (projectId: string) => [...queryKeys.queries.all, 'history', projectId] as const,
    saved: (projectId: string) => [...queryKeys.queries.all, 'saved', projectId] as const,
    result: (projectId: string, query: string) => [...queryKeys.queries.all, 'result', projectId, query] as const,
  },

  // API Keys
  apiKeys: {
    all: ['apiKeys'] as const,
    lists: () => [...queryKeys.apiKeys.all, 'list'] as const,
    list: (projectId: string) => [...queryKeys.apiKeys.lists(), projectId] as const,
  },

  // Audit Logs
  auditLogs: {
    all: ['auditLogs'] as const,
    lists: () => [...queryKeys.auditLogs.all, 'list'] as const,
    list: (projectId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.auditLogs.lists(), projectId, filters] as const,
  },
} as const

/**
 * Prefetch Configurations
 * Define which queries should be prefetched and when
 */
export const prefetchConfig = {
  // Prefetch projects list on app mount
  projects: {
    enabled: true,
    priority: 'high' as const,
  },

  // Prefetch active project details when project is selected
  projectDetails: {
    enabled: true,
    priority: 'high' as const,
  },

  // Prefetch members when navigating to members page
  members: {
    enabled: true,
    priority: 'medium' as const,
  },

  // Prefetch tables list when navigating to data page
  tables: {
    enabled: true,
    priority: 'medium' as const,
  },
} as const

/**
 * Stale Time Configurations for Different Data Types
 * Some data changes frequently, some rarely
 */
export const staleTimeConfig = {
  // Data that changes frequently
  realtime: 30 * 1000, // 30 seconds

  // Data that changes occasionally
  frequent: 2 * 60 * 1000, // 2 minutes

  // Data that changes rarely
  normal: 5 * 60 * 1000, // 5 minutes (default)

  // Data that almost never changes
  static: 30 * 60 * 1000, // 30 minutes

  // Data that never changes (for the session)
  infinite: Infinity,
} as const

/**
 * Cache Time (GC Time) Configurations
 * How long to keep unused data in cache
 */
export const gcTimeConfig = {
  // Remove quickly if not used
  short: 5 * 60 * 1000, // 5 minutes

  // Keep for moderate time
  normal: 10 * 60 * 1000, // 10 minutes (default)

  // Keep for long time
  long: 30 * 60 * 1000, // 30 minutes

  // Keep for very long time
  persistent: 60 * 60 * 1000, // 1 hour
} as const
