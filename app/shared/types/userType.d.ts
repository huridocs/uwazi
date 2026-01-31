/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

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
