import { User } from '#api/users.v2/model/User.js';
import { MongoEntityPermissionChecker } from '#api/core/infrastructure/mongodb/entity/MongoEntityPermissionChecker.js';
import { Specification } from '#api/core/domain/entity/EntityPermissionChecker.js';
import { AccessLevel } from '#api/core/domain/entity/AccessLevel.js';
import { PermissionType } from '#api/core/domain/entity/PermissionType.js';

/**
 * Filters metadata relationship properties based on user permissions.
 * For unauthenticated users, only published entity references are kept.
 * For authenticated users, only accessible entity references (based on permissions) are kept.
 *
 * @param metadata - The entity metadata object containing relationship arrays
 * @param relationshipPropertyNames - Set of property names that are of type 'relationship'
 * @param permissionChecker - The permission checker instance
 * @param user - Optional authenticated user
 * @param filterOut - If true, removes inaccessible entities; if false, marks them with authorized: false
 * @returns Filtered metadata object with inaccessible relationship references removed or marked
 */
export async function filterMetadataRelationships(
  metadata: Record<string, any> | undefined,
  relationshipPropertyNames: Set<string>,
  permissionChecker: MongoEntityPermissionChecker,
  user?: User,
  filterOut = false
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

    if (filterOut) {
      // Old behavior: Remove inaccessible entities completely
      filteredMetadata[propName] = values.filter(
        v => v && typeof v.value === 'string' && accessibleIdSet.has(v.value)
      );
    } else {
      // New default behavior: Keep all entities but mark inaccessible ones with authorized: false
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

/**
 * Get list of entity sharedIds that the user has read access to.
 * Uses batch permission checking for efficiency when user is authenticated.
 * For unauthenticated users, checks published status individually.
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

  // For unauthenticated users, check each entity individually using checkReadPermission
  // This will only return published entities
  const accessible: string[] = [];
  for (const sharedId of sharedIds) {
    const hasPermission = await permissionChecker.checkReadPermission(sharedId, undefined);
    if (hasPermission.isOk() && hasPermission.getData()) {
      accessible.push(sharedId);
    }
  }
  return accessible;
}
