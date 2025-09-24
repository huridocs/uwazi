// @ts-expect-error TS(2307): Cannot find module '../../api/permissions/publicPe... Remove this comment to see the full error message
import { PUBLIC_PERMISSION } from 'api/permissions/publicPermission.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityPermi... Remove this comment to see the full error message
import { MemberWithPermission } from 'shared/types/entityPermisions.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/permissionS... Remove this comment to see the full error message
import { AccessLevels, MixedAccess } from 'shared/types/permissionSchema.js';

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
