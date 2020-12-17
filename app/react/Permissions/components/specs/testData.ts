import { MemberWithPermission } from 'shared/types/entityPermisions';

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
    level: 'read',
  },
  {
    type: 'group',
    _id: 'id2',
    label: 'Group name 2',
    level: 'write',
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
    level: 'mixed',
  },
];

export const pseudoData: MemberWithPermission[] = [
  {
    type: 'user',
    _id: '',
    label: 'User name',
  },
];
