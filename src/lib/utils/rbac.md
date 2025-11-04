# RBAC (Role-Based Access Control) Utilities

Comprehensive utilities for role-based access control management in the Zuno Marketplace Admin application.

## Overview

The RBAC utilities provide a standardized way to handle permissions, roles, and access control throughout the application. The utilities include:

- Resource-based permission checking
- Role hierarchy management
- Permission utilities
- Component guards

## Features

### 1. Centralized Permission Checking

```typescript
import { rbacService } from '@/lib/utils/rbac'

// Check if user has permission
const canAccess = await rbacService.canAccess({
  userId: 'user-123',
  resourceId: 'project-456',
  resourceType: 'project',
  action: 'data.read'
})

// Require permission (throws if unauthorized)
await rbacService.requireAccess({
  userId: 'user-123',
  resourceId: 'project-456',
  resourceType: 'project',
  action: 'data.update'
})
```

### 2. Resource Guards

Create resource-specific guards for components:

```typescript
import { createResourceGuard } from '@/lib/utils/rbac'

const projectGuard = createResourceGuard('project')

// Check permissions
const canRead = await projectGuard.canRead(userId, projectId)
const canUpdate = await projectGuard.canUpdate(userId, projectId)

// Require permissions
await projectGuard.requireUpdate(userId, projectId)
```

### 3. Role Hierarchy Utilities

Check role relationships and permissions:

```typescript
import { PermissionUtils } from '@/lib/utils/rbac'

// Check if role has specific permission
const hasPermission = PermissionUtils.roleHasPermission('admin', 'project.delete')

// Get combined permissions from multiple roles
const allPermissions = PermissionUtils.getCombinedPermissions(['admin', 'editor'])

// Check role hierarchy
const isAdminHigher = PermissionUtils.isRoleHigherOrEqual('admin', 'editor')
```

### 4. Built-in Service

The `rbacService` provides comprehensive methods:

- `canAccess` - Check if user can access resource
- `requireAccess` - Require access (throws if unauthorized)
- `isSuperAdmin` - Check super admin status
- `getUserRole` - Get user's role in project
- `hasAnyPermission` - Check if user has any of the permissions
- `hasAllPermissions` - Check if user has all permissions
- `getUserPermissions` - Get all user's permissions
- `canAccessResourceById` - Check access to specific resource by ID

### 5. Permission-Protected Handlers

Create permission-protected function handlers:

```typescript
import { withPermissionCheck } from '@/lib/utils/rbac'

const protectedHandler = withPermissionCheck(
  (userId, projectId, data) => {
    // Your business logic here
    return result
  }, 
  'data.create' // Required permission
)
```

## Usage Examples

### In Server Actions

```typescript
import { rbacService } from '@/lib/utils/rbac'
import { withServerAction } from '@/lib/utils/try-catch'

export async function secureAction(projectId: string) {
  return withServerAction(async () => {
    const session = await requireAuth()
    
    // Check permission
    await rbacService.requireAccess({
      userId: session.user.id,
      resourceId: projectId,
      resourceType: 'project',
      action: 'project.read'
    })

    // Your business logic here
    return await someBusinessLogic(projectId)
  }, 'secureAction')
}
```

### In Components

```typescript
import { createResourceGuard } from '@/lib/utils/rbac'

export default function ProjectComponent({ projectId, userId }) {
  const projectGuard = createResourceGuard('project')
  
  const [canRead, setCanRead] = useState(false)
  
  useEffect(() => {
    projectGuard.canRead(userId, projectId).then(setCanRead)
  }, [userId, projectId])
  
  if (!canRead) {
    return <div>Access Denied</div>
  }
  
  return <div>Project Content</div>
}
```

## Resource Types

Currently supported resource types:
- `project` - Project-related permissions
- `user` - User-related permissions  
- `data` - Data access permissions

## Migration from Old System

The new RBAC utilities maintain backward compatibility with existing permission functions. The old functions are still available for migration purposes.