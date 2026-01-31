/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

export interface GroupMemberSchema {
  refId: ObjectIdSchema;
}

export interface UserGroupSchema {
  _id?: ObjectIdSchema;
  name: string;
  members: GroupMemberSchema[];
  __v?: number;
}
