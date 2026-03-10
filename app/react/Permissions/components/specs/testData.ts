import { PUBLIC_PERMISSION } from 'api/permissions/publicPermission';
import { MemberWithPermission } from 'shared/types/entityPermisions';
import { AccessLevels, MixedAccess } from 'shared/types/permissionSchema';

export const data: MemberWithPermission[] = [
  {
    type: 'user',
    refId: 'id1',
    label: 'User name',
  },
  {
    type: 'group',
    refId: 'id1',
    label: 'Group name',
    level: AccessLevels.READ,
  },
  {
    type: 'group',
    refId: 'id2',
    label: 'Group name 2',
    level: AccessLevels.WRITE,
  },
  {
    type: 'user',
    refId: 'id1',
    label: 'User name 2',
  },
  {
    type: 'user',
    refId: 'id1',
    label: 'User name 3',
    level: MixedAccess.MIXED,
  },
  {
    ...PUBLIC_PERMISSION,
    level: MixedAccess.MIXED,
  },
];

export const pseudoData: MemberWithPermission[] = [
  {
    type: 'user',
    refId: '',
    label: 'User name',
  },
];
