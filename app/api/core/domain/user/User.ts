import { ObjectId } from 'mongodb';
import { EncryptedPassword } from './EncryptedPassword.js';
import { Credentials } from './Credentials.js';

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
  credentials?: Credentials;
};

class User {
  readonly _id: string;

  readonly username: string;

  readonly role: UserRole;

  readonly email: string;

  readonly groups: UserGroup[];

  credentials?: Credentials;

  constructor(props: UserProps) {
    this._id = props._id;
    this.username = props.username;
    this.role = props.role;
    this.email = props.email;
    this.groups = props.groups ?? [];
    this.credentials = props.credentials;
  }

  setPassword(password: EncryptedPassword) {
    this.credentials = this.credentials
      ? this.credentials.withPassword(password)
      : new Credentials({ password });
  }

  incrementFailedLogins(): void {
    this.credentials = this.credentials!.withIncrementedFailedLogins();
  }

  lock(unlockCode: string): void {
    this.credentials = this.credentials!.withLock(unlockCode);
  }

  clearLockout(): void {
    this.credentials = this.credentials!.withClearedLockout();
  }
}

export { User, UserRole, PUBLIC_USER_ID };
