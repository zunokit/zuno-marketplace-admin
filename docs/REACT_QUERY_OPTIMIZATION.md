# React Query Optimization Guide

## Overview

This document describes the React Query optimization implementation in Zuno Marketplace Admin, including caching strategies, custom hooks, and best practices.

## Architecture

### Directory Structure

```
src/lib/react-query/
├── config.ts              # Query client configuration and query keys factory
├── index.ts               # Main export file
└── hooks/
    ├── index.ts           # Hooks export file
    ├── useProjects.ts     # Project management hooks
    ├── useTables.ts       # Table and data management hooks
    └── useMembers.ts      # Member and invitation management hooks
```

## Key Features

### 1. Centralized Configuration (`config.ts`)

**Default Query Options:**
- **staleTime**: 5 minutes - Data considered fresh for 5 minutes
- **gcTime**: 10 minutes - Keep unused data in cache for 10 minutes
- **refetchOnWindowFocus**: false - Prevent annoying refetches
- **refetchOnMount**: true - Always refetch stale data on mount
- **retry**: 1 with exponential backoff

**Stale Time Configurations:**
```typescript
realtime: 30s     // Frequently changing data
frequent: 2min    // Occasionally changing data
normal: 5min      // Rarely changing data (default)
static: 30min     // Almost never changes
infinite: ∞       // Never changes
```

**GC Time Configurations:**
```typescript
short: 5min       // Remove quickly if unused
normal: 10min     // Default cache time
long: 30min       // Keep for extended period
persistent: 1hr   // Keep for very long time
```

### 2. Query Keys Factory

Hierarchical, type-safe query keys for organized cache management:

```typescript
// Projects
queryKeys.projects.all                    // ['projects']
queryKeys.projects.lists()                // ['projects', 'list']
queryKeys.projects.detail('proj-123')     // ['projects', 'detail', 'proj-123']

// Tables
queryKeys.tables.list('proj-123')         // ['tables', 'list', 'proj-123']
queryKeys.tables.data('proj-123', 'users', 1, 50)  // With pagination

// Members
queryKeys.members.list('proj-123')        // ['members', 'list', 'proj-123']
queryKeys.invitations.list('proj-123')    // ['invitations', 'list', 'proj-123']
```

**Benefits:**
- Type-safe query keys
- Easy cache invalidation
- Clear data relationships
- Consistent naming

### 3. Custom Hooks

#### Project Hooks (`useProjects.ts`)

**Queries:**
- `useProjects()` - Fetch all projects with 5min stale time
- `useProject(id)` - Fetch single project by ID

**Mutations:**
- `useCreateProject()` - Create project with cache invalidation
- `useUpdateProject()` - Update project with cache updates
- `useDeleteProject()` - Delete project with cache cleanup

**Prefetching:**
- `usePrefetchProject()` - Prefetch project details on hover

**Example:**
```typescript
function ProjectList() {
  const { data: projects, isLoading } = useProjects()
  const createProject = useCreateProject()
  const prefetch = usePrefetchProject()

  return (
    <div>
      {projects?.map(project => (
        <div
          key={project.id}
          onMouseEnter={() => prefetch(project.id)}  // Prefetch on hover
        >
          {project.name}
        </div>
      ))}
    </div>
  )
}
```

#### Table Hooks (`useTables.ts`)

**Queries:**
- `useTables(projectId)` - Fetch tables list (30min stale time - schema rarely changes)
- `useTableData(projectId, tableName, page, limit)` - Fetch table data with pagination

**Utilities:**
- `usePrefetchTableData()` - Prefetch next page in background
- `useInvalidateTableData()` - Invalidate after mutations
- `useTableDataCache()` - Direct cache access for optimistic updates

**Example:**
```typescript
function DataTable() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useTableData(projectId, 'users', page, 50)
  const prefetchNext = usePrefetchTableData()

  // Prefetch next page when user reaches current page
  useEffect(() => {
    if (data && page < data.totalPages) {
      prefetchNext(projectId, 'users', page + 1, 50)
    }
  }, [page, data])

  return <Table data={data?.rows} />
}
```

#### Member Hooks (`useMembers.ts`)

**Queries:**
- `useProjectMembers(projectId)` - Fetch project members
- `useProjectInvitations(projectId)` - Fetch pending invitations

**Mutations:**
- `useInviteMember()` - Invite new member with cache invalidation
- `useRemoveMember()` - Remove member with cache cleanup
- `useUpdateMemberRole()` - Update member role
- `useRevokeInvitation()` - Revoke invitation

**Prefetching:**
- `usePrefetchMembersPage()` - Prefetch both members and invitations

**Example:**
```typescript
function MembersPage() {
  const { data: members } = useProjectMembers(projectId)
  const { data: invitations } = useProjectInvitations(projectId)
  const inviteMember = useInviteMember()

  const handleInvite = async (email: string, role: string) => {
    await inviteMember.mutateAsync({ projectId, email, role })
    // Cache automatically updated!
  }

  return (...)
}
```

## Performance Improvements

### Before Optimization

- Manual state management with useState
- No caching between components
- Redundant API calls
- No prefetching
- Manual cache invalidation

### After Optimization

- Automatic caching and deduplication
- Shared state across components
- Intelligent refetching
- Background prefetching
- Automatic cache invalidation

### Expected Performance Gains

| Feature | Before | After | Improvement |
|---------|--------|-------|-------------|
| Repeat page visits | Fresh API call | Cached data | ~100-500ms saved |
| Navigate back | Fresh API call | Instant from cache | ~200-1000ms saved |
| Pagination | Sequential loading | Prefetched | ~300-800ms saved |
| Multiple components | Multiple API calls | Single shared call | Reduced network load |
| Cache management | Manual | Automatic | Developer time saved |

## React Query Devtools

**Enabled in development only:**
- Visual cache inspector
- Query state monitoring
- Network request tracking
- Cache invalidation testing

**Access**: Look for the React Query icon in bottom-right corner

## Cache Invalidation Strategies

### 1. Automatic Invalidation (Mutations)

All mutations automatically invalidate related queries:

```typescript
const createProject = useCreateProject()
// On success, automatically invalidates:
// - queryKeys.projects.lists()
// And sets cache for:
// - queryKeys.projects.detail(newProject.id)
```

### 2. Manual Invalidation

```typescript
const queryClient = useQueryClient()

// Invalidate specific query
queryClient.invalidateQueries({
  queryKey: queryKeys.projects.detail(id)
})

// Invalidate all project queries
queryClient.invalidateQueries({
  queryKey: queryKeys.projects.all
})
```

### 3. Conditional Invalidation

```typescript
queryClient.invalidateQueries({
  queryKey: queryKeys.tables.lists(),
  predicate: (query) => {
    const [, , qProjectId] = query.queryKey
    return qProjectId === projectId
  },
})
```

## Prefetching Strategies

### 1. Hover Prefetching

Prefetch data when user hovers over navigation:

```typescript
const prefetch = usePrefetchProject()

<Link
  href={`/projects/${project.id}`}
  onMouseEnter={() => prefetch(project.id)}
>
  {project.name}
</Link>
```

### 2. Pagination Prefetching

Prefetch next page when user is on current page:

```typescript
useEffect(() => {
  if (currentPage < totalPages) {
    prefetchNext(projectId, tableName, currentPage + 1)
  }
}, [currentPage])
```

### 3. Navigation Prefetching

Prefetch data for likely next page:

```typescript
const prefetchMembers = usePrefetchMembersPage()

// Prefetch when user selects a project
useEffect(() => {
  if (selectedProject) {
    prefetchMembers(selectedProject.id)
  }
}, [selectedProject])
```

## Best Practices

### 1. Use Query Keys Consistently

✅ **Good:**
```typescript
queryKey: queryKeys.projects.detail(id)
```

❌ **Bad:**
```typescript
queryKey: ['project', id]  // Inconsistent, hard to invalidate
```

### 2. Set Appropriate Stale Times

```typescript
// Frequently changing data
useQuery({
  staleTime: staleTimeConfig.frequent  // 2 minutes
})

// Rarely changing data (schema)
useQuery({
  staleTime: staleTimeConfig.static  // 30 minutes
})
```

### 3. Prefetch Predictably

```typescript
// Prefetch on hover for instant navigation
<Link onMouseEnter={() => prefetch(id)}>

// Prefetch next page for smooth pagination
useEffect(() => {
  if (hasNextPage) prefetchNext()
}, [currentPage])
```

### 4. Handle Loading and Error States

```typescript
const { data, isLoading, error } = useProjects()

if (isLoading) return <Skeleton />
if (error) return <ErrorMessage error={error} />
return <ProjectList projects={data} />
```

### 5. Use Optimistic Updates for Better UX

```typescript
const updateRole = useMutation({
  mutationFn: updateMemberRole,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['members'] })

    // Snapshot previous value
    const previous = queryClient.getQueryData(['members'])

    // Optimistically update to new value
    queryClient.setQueryData(['members'], (old) =>
      updateMemberInList(old, newData)
    )

    return { previous }
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['members'], context.previous)
  },
})
```

## Migration Guide

### From useState to React Query

**Before:**
```typescript
const [projects, setProjects] = useState([])
const [loading, setLoading] = useState(false)

useEffect(() => {
  const fetchProjects = async () => {
    setLoading(true)
    const result = await getProjectsAction()
    setProjects(result.data)
    setLoading(false)
  }
  fetchProjects()
}, [])
```

**After:**
```typescript
const { data: projects, isLoading } = useProjects()
```

### From Custom Hooks to React Query Hooks

**Before:**
```typescript
// Custom hook with manual state management
export function useProjectData() {
  const [data, setData] = useState(null)
  // ... manual fetching logic
}
```

**After:**
```typescript
// Use optimized React Query hook
import { useProject } from '@/lib/react-query'

export function MyComponent() {
  const { data } = useProject(projectId)
}
```

## Monitoring and Debugging

### 1. React Query Devtools

- Open devtools in development
- Inspect cache contents
- Monitor network requests
- Test cache invalidation

### 2. Query State

```typescript
const query = useProjects()

console.log(query.status)      // 'loading' | 'error' | 'success'
console.log(query.fetchStatus) // 'fetching' | 'paused' | 'idle'
console.log(query.isStale)     // Is data stale?
console.log(query.dataUpdatedAt) // Last update timestamp
```

### 3. Cache Inspection

```typescript
const queryClient = useQueryClient()

// Get all cached queries
queryClient.getQueryCache().getAll()

// Get specific query state
queryClient.getQueryState(queryKeys.projects.lists())
```

## Performance Tips

1. **Use appropriate stale times** - Balance freshness vs performance
2. **Prefetch predictably** - Hover states, pagination, navigation
3. **Keep cache small** - Set appropriate gcTime
4. **Avoid over-invalidation** - Only invalidate what changed
5. **Use structural sharing** - Enabled by default for better memory
6. **Batch updates** - React Query automatically batches
7. **Monitor with Devtools** - Identify performance bottlenecks

## Troubleshooting

### Query Not Refetching

- Check `staleTime` - data might not be stale yet
- Check `enabled` flag - query might be disabled
- Check network mode - might be offline

### Cache Not Updating After Mutation

- Ensure mutation calls `invalidateQueries`
- Check query keys match exactly
- Verify mutation success callback fires

### Memory Leaks

- Check `gcTime` isn't set too high
- Ensure components unmount properly
- Monitor cache size in Devtools

## Related Files

- Configuration: `src/lib/react-query/config.ts`
- Provider: `src/components/providers/query-provider.tsx`
- Hooks: `src/lib/react-query/hooks/*`

## References

- [TanStack Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Performance Optimization](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
