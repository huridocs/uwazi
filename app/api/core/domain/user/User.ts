type UserRole = 'admin' | 'editor' | 'collaborator';

type UserGroup = {
  _id: string;
  name: string;
};

type UserDTO = {
  _id: string;
  username: string;
  role: UserRole;
  email: string;
  using2fa?: boolean;
  accountLocked?: boolean;
  groups?: UserGroup[];
};

type UserProps = {
  _id: string;
  username: string;
  role: UserRole;
  email: string;
  password: string;
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

  readonly password: string;

  readonly using2fa: boolean;

  readonly secret: string | null;

  readonly failedLogins: number;

  readonly accountLocked: boolean;

  readonly accountUnlockCode: string | null;

  readonly groups: UserGroup[];

  // eslint-disable-next-line max-statements
  constructor(props: UserProps) {
    this._id = props._id;
    this.username = props.username;
    this.role = props.role;
    this.email = props.email;
    this.password = props.password;
    this.using2fa = props.using2fa ?? false;
    this.secret = props.secret ?? null;
    this.failedLogins = props.failedLogins ?? 0;
    this.accountLocked = props.accountLocked ?? false;
    this.accountUnlockCode = props.accountUnlockCode ?? null;
    this.groups = props.groups ?? [];
  }

  isPrivileged() {
    return this.role === 'admin' || this.role === 'editor';
  }

  get asDTO(): UserDTO {
    return {
      _id: this._id,
      username: this.username,
      role: this.role,
      email: this.email,
      using2fa: this.using2fa,
      accountLocked: this.accountLocked,
      groups: this.groups.length > 0 ? this.groups : undefined,
    };
  }
}

export { User };
export type { UserRole, UserGroup, UserDTO, UserProps };
