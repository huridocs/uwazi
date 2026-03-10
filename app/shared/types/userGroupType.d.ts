/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface GroupMemberSchema {
  refId: ObjectIdSchema;
}

export interface UserGroupSchema {
  _id?: ObjectIdSchema;
  name: string;
  members: GroupMemberSchema[];
  __v?: number;
}
