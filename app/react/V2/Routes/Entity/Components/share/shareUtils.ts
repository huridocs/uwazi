import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { AccessLevels, MixedAccessLevels, PermissionType } from '#shared/types/permissionSchema.js';

type Visibility = 'private' | 'published';

const publicReadPermission = {
  refId: 'public',
  type: PermissionType.PUBLIC,
  level: AccessLevels.READ as MixedAccessLevels,
};

const findPublic = (permissions: MemberWithPermission[]) =>
  permissions.find(p => p.type === PermissionType.PUBLIC);

const memberKey = (member: MemberWithPermission) => `${member.type}:${member.refId}`;

const isVisibility = (value: string): value is Visibility =>
  value === 'private' || value === 'published';

const filterCollaboratorCandidates = (
  term: string,
  results: MemberWithPermission[],
  assignments: MemberWithPermission[]
) => {
  const normalized = term.trim().toLowerCase();
  return results.filter(result => {
    if (result.type === PermissionType.PUBLIC) return false;
    if (assignments.some(a => memberKey(a) === memberKey(result))) return false;
    if (result.type === PermissionType.GROUP) {
      return result.label.toLowerCase() === normalized;
    }
    return result.type === PermissionType.USER;
  });
};

export type { Visibility };
export { publicReadPermission, findPublic, memberKey, isVisibility, filterCollaboratorCandidates };
