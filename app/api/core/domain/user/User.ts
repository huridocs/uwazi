import { EncryptedPassword } from './EncryptedPassword.js';

type UserRole = 'admin' | 'editor' | 'collaborator';

type UserGroup = {
  _id: string;
  name: string;
};

type UserProps = {
  _id: string;
  username: string;
  role: UserRole;
  email: string;
  groups?: UserGroup[];
};

class User {
  readonly _id: string;

  readonly username: string;

  readonly role: UserRole;

  readonly email: string;

  readonly groups: UserGroup[];

  password: EncryptedPassword | null;

  constructor(props: UserProps) {
    this._id = props._id;
    this.username = props.username;
    this.role = props.role;
    this.email = props.email;
    this.groups = props.groups ?? [];
    this.password = null;
  }

  setPassword(password: EncryptedPassword) {
    this.password = password;
  }
}

export type { UserRole };
export { User };
