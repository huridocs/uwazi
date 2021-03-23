/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface PermissionSchema {
  refId: ObjectIdSchema;
  type: 'user' | 'group';
  level: 'read' | 'write';
}

export interface PermissionsDataSchema {
  ids: string[];
  permissions: {
    refId: ObjectIdSchema;
    type: 'user' | 'group';
    level: 'read' | 'write';
  }[];
}
