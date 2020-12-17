import { MemberWithPermission } from 'shared/types/entityPermisions';
import { AccessLevels } from 'shared/types/permissionSchema';
import { MixedAccess } from '../../../../shared/types/permissionSchema';

export const data: MemberWithPermission[] = [
  {
    type: 'user',
    _id: 'id1',
    label: 'User name',
  },
  {
    type: 'group',
    _id: 'id1',
    label: 'Group name',
    level: AccessLevels.READ,
  },
  {
    type: 'group',
    _id: 'id2',
    label: 'Group name 2',
    level: AccessLevels.WRITE,
  },
  {
    type: 'user',
    _id: 'id1',
    label: 'User name 2',
  },
  {
    type: 'user',
    _id: 'id1',
    label: 'User name 3',
    level: MixedAccess.MIXED,
  },
];

export const pseudoData: MemberWithPermission[] = [
  {
    type: 'user',
    _id: '',
    label: 'User name',
  },
];
