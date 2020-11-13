/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface GroupMemberSchema {
  _id?:
    | string
    | {
        [k: string]: unknown | undefined;
      };
  username?: string;
  role?: string;
  email?: string;
}

export interface UserGroupSchema {
  _id?:
    | string
    | {
        [k: string]: unknown | undefined;
      };
  name: string;
  members: {
    _id:
      | string
      | {
          [k: string]: unknown | undefined;
        };
    username?: string;
    role?: string;
    email?: string;
  }[];
}
