import { MixedAccessLevels } from './permissionSchema';

export interface MemberWithPermission {
  type: 'user' | 'group';
  _id: string;
  label: string;
  level?: MixedAccessLevels;
}
