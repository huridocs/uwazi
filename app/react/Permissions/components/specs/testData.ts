import { MemberWithPermission } from 'app/Permissions/EntityPermisions';

export const data: MemberWithPermission[] = [
  {
    type: 'user',
    _id: 'id1',
    label: 'User name',
    role: 'admin',
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
    role: 'editor',
  },
  {
    type: 'user',
    _id: 'id1',
    label: 'User name 3',
    role: 'contributor',
    level: 'mixed',
  },
];
