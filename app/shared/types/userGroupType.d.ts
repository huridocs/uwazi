/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/
import { ObjectId } from 'mongodb';

export interface GroupMemberSchema {
  _id: string | ObjectId;
  username?: string;
  role?: string;
  email?: string;
}

export interface UserGroupSchema {
  _id?: string | ObjectId;
  name: string;
  members: {
    _id: string | ObjectId;
    username?: string;
    role?: string;
    email?: string;
  }[];
  __v?: number;
}
