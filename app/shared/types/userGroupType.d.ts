/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface GroupMemberSchema {
  _id: ObjectIdSchema;
}

export interface UserGroupSchema {
  _id?: ObjectIdSchema;
  name: string;
  members: GroupMemberSchema[];
  __v?: number;
}
