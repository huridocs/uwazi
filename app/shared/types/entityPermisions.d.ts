import { ObjectIdSchema } from 'shared/types/commonTypes';
import { MixedAccessLevels } from './permissionSchema';

export interface MemberWithPermission {
  type: 'user' | 'group' | 'public';
  refId: ObjectIdSchema;
  label: string;
  level?: MixedAccessLevels;
}
