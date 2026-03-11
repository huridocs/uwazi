import { User } from '#api/users.v2/model/User.js';
import { MongoEntityPermissionChecker } from '#api/core/infrastructure/mongodb/entity/MongoEntityPermissionChecker.js';
import { Specification } from '#api/core/domain/entity/EntityPermissionChecker.js';
import { AccessLevel } from '#api/core/domain/entity/AccessLevel.js';
import { PermissionType } from '#api/core/domain/entity/PermissionType.js';

/**
 * Get list of entity sharedIds that the user has read access to.
 * Uses batch permission checking for efficiency for both authenticated and unauthenticated users.
 */
async function getAccessibleEntityIds(
  sharedIds: string[],
  permissionChecker: MongoEntityPermissionChecker,
  user?: User
): Promise<string[]> {
  if (sharedIds.length === 0) {
    return [];
  }

  // For authenticated users, use batch filtering with a read specification
  if (user) {
    const specification = new Specification({
      type: PermissionType.User,
      level: AccessLevel.Read,
      actor: user,
    });

    const result = await permissionChecker.filterEntities(sharedIds, specification);

    if (result.isOk()) {
      return result.getData();
    }

    // If filterEntities fails (e.g., no permissions), return empty array
    return [];
  }

  // For unauthenticated users, batch check published status using a single query
  const result = await permissionChecker.getPublishedEntities(sharedIds);
  return result.isOk() ? result.getData() : [];
}

/**
 * Filters metadata relationship properties based on user permissions.
 *
 * Behavior varies by user type and filterUnauthorized setting:
 * - Unauthenticated users (no user):
 *   - filterUnauthorized=false: Mark inaccessible entities with authorized: false
 *   - filterUnauthorized=true: Remove inaccessible entities completely
 * - Authenticated users (collaborators, editors, admins):
 *   - Collaborators: Always mark inaccessible entities with authorized: false (never remove)
 *   - Editors/Admins: Have access to all entities (no filtering or marking)
 *
 * @param metadata - The entity metadata object containing relationship arrays
 * @param relationshipPropertyNames - Set of property names that are of type 'relationship'
 * @param permissionChecker - The permission checker instance
 * @param user - Optional authenticated user
 * @param filterUnauthorized - If true, removes inaccessible entities for unauthenticated users only
 * @returns Filtered metadata object with inaccessible relationship references removed or marked
 */
export async function filterMetadataRelationships(
  metadata: Record<string, any> | undefined,
  relationshipPropertyNames: Set<string>,
  permissionChecker: MongoEntityPermissionChecker,
  user?: User,
  filterUnauthorized = false
): Promise<Record<string, any>> {
  if (!metadata) {
    return {};
  }

  // If no relationship properties, return metadata as-is
  if (relationshipPropertyNames.size === 0) {
    return metadata;
  }

  const filteredMetadata = { ...metadata };

  // Collect all sharedIds from all relationship properties for batch checking
  const allSharedIds = new Set<string>();

  for (const propName of relationshipPropertyNames) {
    const values = metadata[propName];

    if (!Array.isArray(values)) continue;

    // Extract sharedIds from relationship array
    values.forEach(v => {
      if (v && typeof v.value === 'string') {
        allSharedIds.add(v.value);
      }
    });
  }

  // If no references found, return as-is
  if (allSharedIds.size === 0) {
    return filteredMetadata;
  }

  // Batch permission check using filterEntities
  const accessibleIds = await getAccessibleEntityIds(
    Array.from(allSharedIds),
    permissionChecker,
    user
  );

  const accessibleIdSet = new Set(accessibleIds);

  // Filter each relationship property based on accessible IDs
  for (const propName of relationshipPropertyNames) {
    const values = metadata[propName];

    if (!Array.isArray(values)) continue;

    // Only filter out inaccessible entities for unauthenticated users when filterUnauthorized is true
    // For authenticated users (including collaborators), always mark with authorized: false instead
    if (filterUnauthorized && !user) {
      // For unauthenticated users: Remove inaccessible entities completely
      filteredMetadata[propName] = values.filter(
        v => v && typeof v.value === 'string' && accessibleIdSet.has(v.value)
      );
    } else {
      // For authenticated users OR when filterUnauthorized=false:
      // Keep all entities but mark inaccessible ones with authorized: false
      filteredMetadata[propName] = values.map(v => {
        if (v && typeof v.value === 'string' && !accessibleIdSet.has(v.value)) {
          return { ...v, authorized: false };
        }
        return v;
      });
    }
  }

  return filteredMetadata;
}
