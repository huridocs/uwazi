# Uwazi V1 Entity Permissions: Deep Dive

This document explains the end-to-end flow for entity permissions in the V1 API, focusing on how permissions are created, managed, validated, and enforced when accessing entities.

Updated: 2025-11-07

## Important: Scope of the Permissions System

**⚠️ CRITICAL NAMING CLARIFICATION**: Despite the generic naming in code (`app/api/permissions/`, `entitiesPermissions`, `PermissionSchema`, etc.), this permission system **ONLY applies to Entities**.

Other resources in Uwazi do NOT use this permission system:

- **Pages**: No permission model (uses basic `instanceModel`, not `instanceModelWithPermissions`)
- **Files**: Inherit permissions from their parent entity (checked via `entity.permissions`)
- **Templates/Thesauri**: No granular permissions (admin-only management)
- **Settings**: Role-based access only
- **Users/UserGroups**: Role-based access only

The `ModelWithPermissions` class and the entire `app/api/permissions/` module are **exclusively for Entity access control**. This is an architectural choice—only entities (documents/records in Uwazi) require fine-grained, per-resource access control with user/group-level permissions.

### Why Only Entities?

- **Entities** are the primary user-generated content (documents, records) that need collaborative access control
- **Files** (PDFs, attachments) derive their permissions from the entity they belong to
- **Templates, Thesauri, Settings** are configuration/metadata—managed at the role level (typically admin/editor only)
- **Pages** are public site content—no individual access control needed

This keeps the permission system focused and prevents unnecessary complexity in areas that don't need granular control.

## What are Entity Permissions?

Entity permissions in Uwazi control who can read or write (edit) specific entities. The permission system is based on:

1. **User roles**: `admin`, `editor`, `collaborator`
2. **Permission levels**: `read`, `write`, `mixed` (used in UI for batch operations)
3. **Permission types**: `user`, `group`, `public`
4. **Published status**: A boolean flag that makes entities visible to everyone (public read access)

### Data Structure

Permissions are stored directly on the entity document in the `permissions` field:

```typescript
interface EntitySchema {
  _id?: ObjectIdSchema;
  sharedId?: string;
  language?: string;
  title?: string;
  template?: ObjectIdSchema;
  published?: boolean; // Public visibility flag
  permissions?: PermissionSchema[]; // Access control list
  // ... other fields
}

interface PermissionSchema {
  refId: ObjectIdSchema; // References user._id or userGroup._id
  type: 'user' | 'group' | 'public';
  level: 'read' | 'write' | 'mixed';
}
```

The `permissions` field is stored as `select: false` in the MongoDB schema, meaning it's excluded from query results by default unless explicitly requested with `+permissions`.

## Entity Creation and Initial Permissions

### What Happens When a User Creates a New Entity

**Location**: `app/api/entities/entities.js` (V1 flow), `app/api/odm/ModelWithPermissions.ts`

When a user creates an entity:

1. **Initial State**:

   - `published: false` (entity is private by default)
   - `permissions: []` initially, but...

2. **Permission Auto-Assignment**:

   - The creating user is **automatically granted `write` access**
   - This happens in `ModelWithPermissions.save()` via `appendPermissionData()`
   - The permission entry is: `{ refId: user._id, type: 'user', level: 'write' }`

3. **Multi-Language Creation**:
   - Entities are created for **each language** defined in settings
   - Same `sharedId` across all language variants
   - Same permissions and published status across all variants

**Code Flow**:

```javascript
// entities.js - save() method
if (!doc.sharedId) {
  doc.user = user._id;
  doc.creationDate = date.currentUTC();
  doc.published = false; // Private by default
}

// ModelWithPermissions.ts - appendPermissionData()
const appendPermissionData = (data, user) => ({
  ...data,
  permissions: [
    {
      refId: user._id.toString(),
      type: PermissionType.USER,
      level: AccessLevels.WRITE,
    },
  ],
});
```

**Important**: The `permissions` parameter passed in the entity payload during save is **ignored and stripped out**. Users cannot manually set their own permissions during entity creation—the system enforces that only the creator gets initial write access.

## Managing Permissions After Creation

### Permission Management Interface

**UI Component**: `app/react/Permissions/components/ShareEntityModal.tsx`

Users can manage permissions through the "Share" dialog, which allows:

- Adding users and groups with `read` or `write` access
- Setting public visibility (publishing/unpublishing)
- Viewing current permissions

### API Endpoints

**File**: `app/api/permissions/routes.ts`

#### POST `/api/entities/permissions`

Sets permissions for one or more entities.

**Authorization**: `admin`, `editor`, `collaborator`

**Request Body**:

```typescript
{
  ids: string[];  // Array of entity sharedIds
  permissions: [{
    refId: ObjectIdSchema;
    type: 'user' | 'group' | 'public';
    level: 'read' | 'write' | 'mixed';
  }]
}
```

**Business Logic** (`app/api/permissions/entitiesPermissions.ts`):

1. **Validation**: Ensures permissions are unique by refId (no duplicate entries per user/group)
2. **Publishing restrictions**:
   - Only `admin` and `editor` roles can change the `published` status
   - `collaborator` role cannot publish/unpublish entities
3. **Mixed access handling**: When `level: 'mixed'` is passed, the existing permission level is preserved
4. **Batch updates**: Updates all language variants (same `sharedId`) atomically
5. **Re-indexing**: Automatically re-indexes entities in Elasticsearch after permission changes

#### PUT `/api/entities/permissions`

Retrieves current permissions for entities (used by the UI).

**Request Body**:

```typescript
{
  sharedIds: string[];
}
```

**Response**: Returns aggregated permissions across all language variants, showing `mixed` level when permissions differ across languages.

#### GET `/api/collaborators`

Searches for users and groups to share with.

**Query Parameter**: `filterTerm` (username, email, or group name)

## Business Rules and Constraints

### 1. Uniqueness Constraint ⚠️

**CRITICAL**: The system enforces that **each `refId` can only appear ONCE in the permissions array**, regardless of the `type` field.

**Validation Location**: `app/shared/types/permissionSchema.ts`

```typescript
// This validation ONLY checks refId uniqueness, NOT type
const allowedIds = data.permissions.map(item => item.refId);
const uniqueIds = allowedIds.filter(unique);
if (allowedIds.length !== uniqueIds.length) {
  throw new Error('Permissions should be unique by person/group');
}
```

**Examples**:

```typescript
// ✅ VALID - Different refIds
permissions: [
  { refId: 'user_abc', type: 'user', level: 'read' },
  { refId: 'group_xyz', type: 'group', level: 'write' },
];

// ❌ INVALID - Duplicate refId (same type)
permissions: [
  { refId: 'user_abc', type: 'user', level: 'read' },
  { refId: 'user_abc', type: 'user', level: 'write' }, // Error!
];

// ❌ INVALID - Duplicate refId (different types)
permissions: [
  { refId: 'abc123', type: 'user', level: 'read' },
  { refId: 'abc123', type: 'group', level: 'write' }, // Error! Same refId
];
```

**Why This Rule Exists**:

- In practice, user IDs and group IDs come from different MongoDB collections (`users` and `usergroups`)
- They use ObjectId format, so collision is virtually impossible
- If the same refId appears twice, it indicates a data integrity issue
- The `type` field is used for **lookup**, not for uniqueness

### 2. User Role Privileges

**File**: `app/api/users.v2/model/User.ts`, `app/api/odm/ModelWithPermissions.ts`

| Role             | Create Entities | Edit Own Entities | Edit Others' Entities                  | Delete Entities                        | Manage Permissions               | Publish/Unpublish |
| ---------------- | --------------- | ----------------- | -------------------------------------- | -------------------------------------- | -------------------------------- | ----------------- |
| **Admin**        | ✓ Full access   | ✓ Full access     | ✓ Full access                          | ✓ Full access                          | ✓ Full control                   | ✓ Can publish     |
| **Editor**       | ✓ Full access   | ✓ Full access     | ✓ Full access                          | ✓ Full access                          | ✓ Full control                   | ✓ Can publish     |
| **Collaborator** | ✓ Can create    | ✓ Can edit        | ⚠️ Only with explicit write permission | ⚠️ Only with explicit write permission | ⚠️ Can manage but cannot publish | ✗ Cannot publish  |

**Privileged Users**: `admin` and `editor` roles bypass permission checks—they have implicit write access to all entities.

### 3. Permission Levels

**File**: `app/shared/types/permissionSchema.ts`

```typescript
enum AccessLevels {
  READ = 'read',
  WRITE = 'write',
}

enum MixedAccess {
  MIXED = 'mixed', // UI-only, used for batch operations
}
```

- **`read`**: Can view unpublished entities, cannot edit
- **`write`**: Can view and edit entities, can manage permissions
- **`mixed`**: UI-only indicator; during save, preserves existing permission level

### 3. Permission Types

```typescript
enum PermissionType {
  USER = 'user', // Individual user access
  GROUP = 'group', // User group access
  PUBLIC = 'public', // Public visibility (via published flag)
}
```

- **User permissions**: Direct assignment to a user by their `_id`
- **Group permissions**: Assignment to a user group; all group members inherit the permission
- **Public permissions**: Represented by `published: true` on the entity, not an actual permission entry

### 4. Published Status Rules

**File**: `app/api/permissions/entitiesPermissions.ts`

- When `published: true`:
  - Entity is visible to **everyone** (including anonymous users) for **read access**
  - Write access still requires explicit permissions
- When `published: false`:
  - Entity is **private**
  - Only users with explicit permissions (or admins/editors) can access it
- Publishing restrictions:
  - Only `admin` and `editor` can change published status
  - `collaborator` throws error: "Insufficient permissions to share/unshare publicly"

### 5. Permission Inheritance from Groups

**File**: `app/api/odm/ModelWithPermissions.ts`, `app/shared/permissionsUtils.ts`

When checking if a user has access:

1. System gathers user's `_id` and all `group._id` values
2. Checks if any permission entry's `refId` matches the user's IDs or group IDs
3. For write access, also verifies `level === 'write'`

```typescript
const getUserPermissionIds = user => {
  const userIds = user.groups ? user.groups.map(g => g._id.toString()) : [];
  if (user._id) {
    userIds.push(user._id.toString());
  }
  return userIds;
};
```

### 6. Multi-Language Consistency

All language variants of an entity (same `sharedId`) share:

- Same `published` status
- Same `permissions` array

This is enforced by `entitiesPermissions.set()`, which updates all variants atomically.

## Permission Checking: Before Action

### V1 Permission Enforcement

**File**: `app/api/odm/ModelWithPermissions.ts`

The `ModelWithPermissions` class wraps all database operations with permission checks:

#### Read Access Check

```typescript
async get(query, select, options) {
  const user = permissionsContext.getUserInContext();
  const results = await super.get(
    appendPermissionQuery(query, AccessLevels.READ, user),
    select,
    options
  );
  return requestingPermissions(select)
    ? filterPermissionsData(results, user)
    : results;
}
```

**Logic**:

- **No user (anonymous)**: Only returns `published: true` entities
- **Collaborator**: Returns entities where:
  - `published: true`, OR
  - User/group has any permission entry
- **Admin/Editor**: No restrictions

#### Write Access Check

```typescript
async save(data) {
  const user = permissionsContext.getUserInContext();
  const query = { _id: data._id };

  if (data._id || data.permissions) {
    return super.save(data, appendPermissionQuery(query, AccessLevels.WRITE, user));
  }

  // New entity: auto-add creator permission
  return super.save(appendPermissionData(data, user));
}
```

**Logic for updates**:

- **No user**: Denied (cannot update)
- **Collaborator**: Can update only if:
  - Has a permission entry with `level: 'write'`
- **Admin/Editor**: Can update anything

#### Delete Access Check

```typescript
async delete(condition) {
  const user = permissionsContext.getUserInContext();
  return super.delete(
    appendPermissionQuery(condition, AccessLevels.WRITE, user)
  );
}
```

**Same rules as write access**.

### V2 Authorization Service

**File**: `app/api/authorization.v2/services/AuthorizationService.ts`

The V2 authorization service provides more structured permission checking:

```typescript
class AuthorizationService {
  async isAuthorized(level: 'read' | 'write', sharedIds: string[]) {
    if (this.isPrivileged()) {
      // admin or editor
      return true;
    }

    const allEntitiesPermissions = this.getRelatedPermissionsSets(sharedIds);

    if (this.authenticatedUser) {
      return allEntitiesPermissions.every(entityPermissions =>
        entityPermissions.allowsUserTo(user, level)
      );
    }

    return level === 'read' && allEntitiesPermissions.every(ep => ep.allowsPublicReads());
  }
}
```

**EntityPermissions model** (`app/api/authorization.v2/model/EntityPermissions.ts`):

```typescript
class EntityPermissions {
  allowsUserTo(user: User, level: 'read' | 'write') {
    const idsForUser = new Set(user.groups.concat(user._id));

    if (level === 'read') {
      return this.published || this.permissions.some(p => idsForUser.has(p.refId));
    }

    return this.permissions.some(p => p.level === 'write' && idsForUser.has(p.refId));
  }

  allowsPublicReads() {
    return this.published;
  }
}
```

### Search and Filtering

**File**: `app/api/search.v2/permissionsFilters.ts`

Elasticsearch queries automatically filter results based on permissions:

```typescript
export const permissionsFilters = query => {
  const user = permissionsContext.getUserInContext();

  return [
    // Anonymous users: only published
    !user && { term: { published: 'true' } },

    // Authenticated users
    user && {
      bool: {
        should: [
          // Published entities
          { term: { published: 'true' } },
          // Or entities with permissions for user/groups
          needsPermissionCheck() && {
            nested: {
              path: 'permissions',
              query: {
                terms: {
                  'permissions.refId': permissionsContext.permissionsRefIds(),
                },
              },
            },
          },
        ],
      },
    },
  ].filter(cleanUp);
};
```

### Permission Context

**File**: `app/api/permissions/permissionsContext.ts`

The `permissionsContext` singleton provides the current user in request context:

```typescript
export const permissionsContext = {
  getUserInContext: () => appContext.get('user'),

  permissionsRefIds() {
    const user = this.getUserInContext();
    return [...(user?.groups || []).map(g => g._id.toString()), user?._id?.toString()].filter(
      v => !!v
    );
  },

  needsPermissionCheck() {
    const user = this.getUserInContext();
    return !['admin', 'editor'].includes(user?.role || '');
  },
};
```

This is set per-request by authentication middleware.

### Specific Action Checks

#### Batch Updates

**File**: `app/api/entities/entities.js` - `validateWritePermissions()`

When updating multiple entities at once:

```javascript
const validateWritePermissions = (ids, entitiesToUpdate) => {
  const user = permissionsContext.getUserInContext();
  if (!['admin', 'editor'].includes(user.role)) {
    const userIds = user.groups.map(g => g._id.toString());
    userIds.push(user._id.toString());

    const allowedEntitiesToUpdate = entitiesToUpdate.filter(e => {
      const writeGranted = (e.permissions || [])
        .filter(p => p.level === AccessLevels.WRITE)
        .map(p => p.refId)
        .filter(id => userIds.includes(id));
      return writeGranted.length > 0;
    });

    if (allowedEntitiesToUpdate.length !== ids.length) {
      throw Error('Have not permissions granted to update the requested entities');
    }
  }
};
```

#### File Access

**File**: `app/api/files/routes.ts` - `checkEntityPermission()`

File download/upload permissions are checked against the entity's permissions:

```typescript
const checkEntityPermission = async (file, user, level = 'read') => {
  if (['admin'].includes(user?.role || '')) return true;

  const [fileInDB] = await files.get({ _id: file._id });
  const relatedEntities = await entities.get({ sharedId: fileInDB.entity }, '_id, permissions', {
    withoutDocuments: true,
  });

  if (level === 'read') {
    return relatedEntities.length > 0; // Entity exists and is accessible
  }

  return checkWritePermissions(user, relatedEntities[0]?.permissions);
};
```

## Permission Denial Scenarios

### Anonymous Users (Not Logged In)

- ✗ Cannot create entities
- ✓ Can read `published: true` entities only
- ✗ Cannot write/update any entity
- ✗ Cannot delete any entity
- ✗ Cannot access unpublished entities even via direct link

### Collaborator Role

- ✓ Can create entities (auto-granted write permission on own entities)
- ⚠️ Can read:
  - All published entities
  - Unpublished entities with explicit permission (user or group)
- ⚠️ Can write/update:
  - Only entities where they have `write` permission
- ⚠️ Can delete:
  - Only entities where they have `write` permission
- ✗ **Cannot** publish or unpublish entities
- ⚠️ Can share entities and manage permissions, but publishing changes will be rejected

### Editor/Admin Roles

- ✓ Full access to all operations
- ✓ Bypass all permission checks
- ✓ Can publish/unpublish any entity
- ✓ Can manage any entity's permissions

## Key Files and Components

### Backend - Core Logic

- `app/api/entities/entities.js` - V1 entity save/update/delete logic
- `app/api/entities/entitiesModel.ts` - Entity model using `instanceModelWithPermissions` (the ONLY model that uses this)
- `app/api/odm/ModelWithPermissions.ts` - Permission enforcement layer for database operations
- `app/api/permissions/entitiesPermissions.ts` - Permission management service
- `app/api/permissions/permissionsContext.ts` - Request context for current user
- `app/api/authorization.v2/` - V2 authorization service and models

**Contrast**: Other models use basic `instanceModel`:

- `app/api/pages/pagesModel.ts` - Uses `instanceModel` (no permissions)
- `app/api/files/filesModel.ts` - Uses `instanceModel` (inherits from entity)
- `app/api/users/usersModel.ts` - Uses `instanceModel` (role-based only)

### Backend - Types

- `app/shared/types/permissionSchema.ts` - Permission enums and schemas
- `app/shared/types/permissionType.d.ts` - TypeScript types
- `app/shared/types/entityType.d.ts` - Entity schema with permissions field
- `app/shared/permissionsUtils.ts` - Helper functions for permission checks

### Backend - Routes

- `app/api/permissions/routes.ts` - Permission management endpoints (Entity-specific only)
- `app/api/entities/routes.js` - Entity CRUD endpoints with authorization
- `app/api/files/routes.ts` - File endpoints that inherit entity permissions

**Note**: The route `/api/entities/permissions` might seem generic, but it exclusively manages entity permissions. There are no equivalent `/api/pages/permissions` or `/api/files/permissions` endpoints because those resources don't have the same permission model.

### Frontend

- `app/react/Permissions/components/ShareEntityModal.tsx` - UI for managing permissions
- `app/react/Permissions/components/ShareButton.tsx` - Button to open share dialog
- `app/react/Auth/components/NeedAuthorization.tsx` - React component for role-based UI rendering
- `app/react/V2/Components/UI/NeedAuthorization.tsx` - V2 version of authorization component

### Search

- `app/api/search.v2/permissionsFilters.ts` - Elasticsearch permission filters

## Summary of Permission Flow

### Creating an Entity

1. User must be authenticated (`admin`, `editor`, or `collaborator`)
2. Entity created with `published: false` (private)
3. Creator automatically gets `{ type: 'user', level: 'write', refId: userId }` permission
4. Entity created for all configured languages with same permissions

### Managing Permissions

1. User with write access opens "Share" modal
2. Adds users/groups with read or write level
3. Admin/Editor can toggle published status
4. Collaborator cannot change published status
5. Permissions saved via `POST /api/entities/permissions`
6. All language variants updated atomically
7. Entities re-indexed in Elasticsearch

### Checking Permissions Before Action

1. Request middleware sets user context via `permissionsContext`
2. For database queries:
   - `ModelWithPermissions` appends permission filters to query
   - Admin/Editor: No filters (full access)
   - Collaborator: Filter by `published: true` OR user/group in `permissions`
   - Anonymous: Filter by `published: true` only
3. For write operations:
   - Collaborator: Must have `level: 'write'` in permissions
   - Admin/Editor: Always allowed
   - Anonymous: Always denied
4. Search queries include Elasticsearch permission filters
5. File access inherits entity permissions

### Access Decision Logic

```
Can User Access Entity?

IF user.role IN ['admin', 'editor']:
  ALLOW (full access)

ELSE IF action === 'read':
  IF entity.published === true:
    ALLOW
  ELSE IF entity.permissions includes user._id OR user.groups:
    ALLOW
  ELSE:
    DENY

ELSE IF action === 'write':
  IF entity.permissions includes (refId=user._id OR user.groups) AND level='write':
    ALLOW
  ELSE:
    DENY

ELSE IF action === 'publish/unpublish':
  IF user.role IN ['admin', 'editor']:
    ALLOW
  ELSE:
    DENY (Collaborators cannot publish)
```

## Edge Cases and Special Behaviors

1. **Ignoring permissions in save payload**: Any `permissions` field passed during entity creation/update is stripped out. Only the permission management API can modify permissions.

2. **Multi-language sync**: Permission changes affect all language variants simultaneously. You cannot have different permissions per language.

3. **Mixed access level**: Used only in the UI for batch operations when entities have different permission levels. During save, `mixed` preserves existing levels.

4. **Group membership changes**: If a user is added to or removed from a group, their access to entities shared with that group changes immediately (no cache).

5. **Creator removal**: The creator can remove their own write permission, potentially locking themselves out. Admin/Editor intervention would be needed to restore access.

6. **Bulk delete**: Only `admin` and `editor` can bulk delete. Single delete respects write permissions.

7. **Public permission pseudo-entry**: The `PUBLIC_PERMISSION` constant is used in the UI as a special entry but doesn't create an actual permission record—it toggles the `published` flag.

8. **Permission filtering on read**: When requesting permissions with `+permissions` in the select, non-admin/editor users get filtered results showing only their accessible entities, with `permissions: undefined` for entities they can't write to.

9. **Files inherit entity permissions**: Files don't have their own permission system. When checking file access (download/upload), the system looks up the parent entity via `file.entity` (sharedId) and checks that entity's permissions. This is implemented in `app/api/files/routes.ts` via `checkEntityPermission()`.

## Final Summary: What This System Controls

**This permission system controls access to Entities ONLY:**

- ✅ Entities (documents/records) - Full CRUD with granular user/group permissions
- ✅ Entity files - Indirectly, by checking parent entity permissions
- ❌ Pages - No permission model
- ❌ Templates - Role-based access only (admin/editor)
- ❌ Thesauri - Role-based access only (admin/editor)
- ❌ Settings - Role-based access only (admin)
- ❌ Users/Groups - Role-based access only (admin)

The generic naming (`permissions`, `PermissionSchema`, `/api/entities/permissions`) might suggest a broader system, but it's architecturally scoped to entity access control only. This is by design—entities are user-generated content requiring collaborative permissions, while other resources use simpler role-based or public access models.
