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
  password?: string;
  using2fa?: boolean;
  secret?: string | null;
  failedLogins?: number;
  accountLocked?: boolean;
  accountUnlockCode?: string | null;
  groups?: UserGroup[];
};

class User {
  readonly _id: string;

  readonly username: string;

  readonly role: UserRole;

  readonly email: string;

  readonly using2fa: boolean;

  readonly accountLocked: boolean;

  readonly secret: string | null;

  readonly failedLogins: number | null;

  readonly accountUnlockCode: string | null;

  readonly groups: UserGroup[];

  password: string | null;

  constructor(props: UserProps) {
    this._id = props._id;
    this.username = props.username;
    this.role = props.role;
    this.email = props.email;
    this.using2fa = props.using2fa ?? false;
    this.secret = props.secret ?? null;
    this.groups = props.groups ?? [];
    this.password = null;
  }

  isPrivileged() {
    return this.role === 'admin' || this.role === 'editor';
  }

  isAnonymous() {
    return this._id === '__anonymous__';
  }

  setPassword(password: string) {
    this.password = password;
  }
}

export { User };
