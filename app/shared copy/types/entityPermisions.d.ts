import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { MixedAccessLevels } from '#shared/types/permissionSchema.js';

export interface MemberWithPermission {
  type: 'user' | 'group' | 'public';
  refId: ObjectIdSchema;
  label: string;
  level?: MixedAccessLevels;
}
