import { ObjectId } from 'mongodb';
import { EncryptedPassword } from './EncryptedPassword.js';

const PUBLIC_USER_ID = new ObjectId('698c35e7cf8880419d91fe4d');

enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  COLLABORATOR = 'collaborator',
}

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

  password?: EncryptedPassword | null;

  constructor(props: UserProps) {
    this._id = props._id;
    this.username = props.username;
    this.role = props.role;
    this.email = props.email;
    this.groups = props.groups ?? [];
  }

  setPassword(password: EncryptedPassword) {
    this.password = password;
  }
}

export { User, UserRole, PUBLIC_USER_ID };
