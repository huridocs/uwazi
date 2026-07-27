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
  groups?: GroupSummary[];
};

type NewUser = Omit<User, '_id'> & { password?: string };

type CreateUserRequest = NewUser;

type CreateUserResponse = {
  user: Required<Pick<User, '_id' | 'email' | 'role' | 'username'>>;
};

type DeleteUserRequest = string[];

type DeleteUserResponse = {
  acknowledged: boolean;
  deletedCount: number;
};

type GetUsersResponse = User[];

type UpdateUserRequest = User;

type UpdateUserResponse = { user: Required<Pick<User, '_id' | 'email' | 'role' | 'username'>> };

type UnlockAccountRequest = { username: string; code: string };

type UnlockAccountResponse = string;

type UnlockBlockedUserRequest = { _id: string };

type UnlockBlockedUserResponse = string;

type RecoverPasswordRequest = { email: string };

type RecoverPasswordResponse = string;

type ResetPasswordRequest = { key: string; password: string };

type ResetPasswordResponse = string;

export type {
  User,
  GetUsersResponse,
  CreateUserResponse,
  CreateUserRequest,
  DeleteUserRequest,
  DeleteUserResponse,
  UserGroup,
  UpdateUserRequest,
  UpdateUserResponse,
  UnlockAccountRequest,
  UnlockAccountResponse,
  UnlockBlockedUserRequest,
  UnlockBlockedUserResponse,
  RecoverPasswordRequest,
  RecoverPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
};
