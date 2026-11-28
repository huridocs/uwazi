import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { PermissionsDataSchema } from '#shared/types/permissionType.js';
import { AccessLevels, MixedAccess, PermissionType } from '#shared/types/permissionSchema.js';

type Visibility = 'private' | 'published' | 'mixed';
type SavedPermission = PermissionsDataSchema['permissions'][number];

const visibilityFromPermissions = (permissions: MemberWithPermission[]): Visibility => {
  const level = permissions.find(member => member.type === PermissionType.PUBLIC)?.level;
  if (level === MixedAccess.MIXED) return 'mixed';
  if (level) return 'published';
  return 'private';
};

const singleEntityHasMixedMember = (sharedIds: string[], assignments: MemberWithPermission[]) =>
  sharedIds.length === 1 && assignments.some(member => member.level === MixedAccess.MIXED);

const permissionsToSave = (
  assignments: MemberWithPermission[],
  visibility: Visibility
): SavedPermission[] => [
  ...assignments
    .filter(member => member.level !== MixedAccess.MIXED)
    .map(member => ({
      refId: member.refId,
      type: member.type,
      level: member.level === AccessLevels.WRITE ? AccessLevels.WRITE : AccessLevels.READ,
    })),
  ...(visibility === 'private'
    ? []
    : [
        {
          refId: 'public',
          type: PermissionType.PUBLIC,
          level: visibility === 'mixed' ? MixedAccess.MIXED : AccessLevels.READ,
        },
      ]),
];

const memberKey = (member: MemberWithPermission) => `${member.type}:${member.refId}`;

const isVisibility = (value: string): value is Visibility =>
  value === 'private' || value === 'published';

const shareSectionLabelClass = 'text-meta font-semibold uppercase tracking-wide text-ink-tertiary';

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
export {
  visibilityFromPermissions,
  singleEntityHasMixedMember,
  permissionsToSave,
  memberKey,
  isVisibility,
  shareSectionLabelClass,
  filterCollaboratorCandidates,
};
