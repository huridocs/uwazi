type GroupSummary = {
  _id: string;
  name: string;
};

type GroupMember = {
  refId: string;
  username: string;
};

type UserGroup = {
  _id?: string;
  name: string;
  members: GroupMember[];
};

type User = {
  _id?: string;
  username: string;
  role: 'admin' | 'editor' | 'collaborator';
  email: string;
  password?: string;
  using2fa?: boolean;
  accountLocked?: boolean;
  failedLogins?: number;
  groups?: GroupSummary[];
};

type NewUser = Omit<User, '_id'> & { password?: string };

type CreateUserRequest = NewUser;

type CreateUserResponse = {
  user: Required<Pick<User, '_id' | 'email' | 'role' | 'username'>>;
};

export type {
  User,
  UserGroup,
  GroupMember,
  GroupSummary,
  CreateUserRequest,
  CreateUserResponse,
};
