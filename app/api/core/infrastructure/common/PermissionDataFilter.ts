import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { PermissionSchema } from '#shared/types/permissionType.js';

export type PermissionedDocument = { permissions?: PermissionSchema[] };

const WRITE_LEVELS = new Set<PermissionSchema['level']>(['write', 'mixed']);

/**
 * Safe-by-default data filter for permission-aware reads.
 *
 * Non-privileged actors (collaborators and anonymous users) must never see
 * the permissions array of a document unless they hold a write-level grant
 * on it — otherwise reading a published document would leak who else has
 * access to it. Privileged actors (admin / editor / system) are unaffected.
 *
 * Semantics match the legacy V1 behavior: the array is kept whole or removed
 * entirely — it is never partially filtered.
 *
 * This is applied by the permission-enforced collection/table wrappers so
 * every read path is covered, not just the facades that request permissions.
 */
export const filterPermissionsForActor = <T extends PermissionedDocument>(
  doc: T,
  accessContext: AccessContext
): T => {
  if (accessContext.isPrivileged()) return doc;
  if (doc.permissions === undefined) return doc;
  const refIds = accessContext.refIds;
  const hasWriteGrant = doc.permissions.some(
    permission => WRITE_LEVELS.has(permission.level) && refIds.includes(permission.refId.toString())
  );
  return hasWriteGrant ? doc : { ...doc, permissions: undefined };
};
