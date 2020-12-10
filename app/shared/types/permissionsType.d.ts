/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface PermissionSchema {
  _id: ObjectIdSchema;
  type: 'user' | 'group';
  level: 'read' | 'write' | 'mixed';
}

export type PermissionsSchema = PermissionSchema[];

export interface GrantedPermissionSchema {
  _id: ObjectIdSchema;
  type: 'user' | 'group';
  level: 'read' | 'write' | 'mixed';
  label: string;
  role?: 'contributor' | 'editor' | 'admin';
}
