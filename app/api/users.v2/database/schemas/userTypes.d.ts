/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdType } from 'api/common.v2/database/schemas/commonTypes';

import { UserSchema as originalUserSchema } from 'shared/types/userType';

export interface UserDBOType {
  _id?: ObjectIdType;
  __v?: number;
  username: string;
  role: 'admin' | 'editor' | 'collaborator';
  email: string;
  password?: string;
  using2fa?: boolean;
  groups?: {
    _id: ObjectIdType;
    name: string;
  }[];
}
