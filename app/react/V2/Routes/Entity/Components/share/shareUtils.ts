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

const exactCollaboratorMatches = (
  term: string,
  results: MemberWithPermission[],
  assignments: MemberWithPermission[]
) => {
  const normalized = term.trim().toLowerCase();
  return results.filter(result => {
    if (result.type === PermissionType.PUBLIC) return false;
    if (assignments.some(a => a.refId === result.refId && a.type === result.type)) return false;
    if (result.type === PermissionType.GROUP) {
      return result.label.toLowerCase() === normalized;
    }
    return true;
  });
};

const hintClass =
  'rounded-md border border-border bg-paper px-2.5 py-1.5 text-[10px] font-medium leading-snug text-ink';

const statusMessageClass = 'px-1 py-6 text-center text-sm text-ink-muted';

const noticeClass = 'flex items-center gap-1 text-[10px] leading-tight text-ink-secondary';

export type { Visibility };
export {
  publicReadPermission,
  findPublic,
  memberKey,
  isVisibility,
  exactCollaboratorMatches,
  hintClass,
  statusMessageClass,
  noticeClass,
};
