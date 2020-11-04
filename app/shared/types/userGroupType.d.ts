/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface UserGroupSchema {
  _id?:
    | string
    | {
        [k: string]: unknown | undefined;
      };
  name: string;
  users: {
    _id:
      | string
      | {
          [k: string]: unknown | undefined;
        };
  }[];
}
