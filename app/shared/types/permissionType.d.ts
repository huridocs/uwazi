/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface PermissionSchema {
  _id: ObjectIdSchema;
  type: 'user' | 'group';
  level: 'read' | 'write';
}
