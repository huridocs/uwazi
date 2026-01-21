/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { UserSchema } from '#shared/types/userType.js';

export interface UserSchema {
  _id?: ObjectIdSchema;
  __v?: number;
  username: string;
  role: 'admin' | 'editor' | 'collaborator';
  email: string;
  password?: string;
  using2fa?: boolean;
  accountLocked?: boolean;
  failedLogins?: number;
  groups?: {
    _id: ObjectIdSchema;
    name: string;
  }[];
}
