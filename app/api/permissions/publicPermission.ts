import { MemberWithPermission } from '../../shared/types/entityPermisions.js';
import { PermissionType } from '../../shared/types/permissionSchema.js';

export const PUBLIC_PERMISSION: MemberWithPermission = {
  refId: 'public',
  type: PermissionType.PUBLIC,
  label: 'Public',
};
