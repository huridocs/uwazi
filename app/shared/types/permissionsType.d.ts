/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface PermissionSchema {
  _id: string | ObjectIdSchema;
  type: string;
  permission: string;
}

export type PermissionsSchema = {
  _id: string | ObjectIdSchema;
  type: string;
  permission: string;
}[];
