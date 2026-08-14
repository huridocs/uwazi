import type { GroupSummary } from './UserGroups.js';

/**
 * The **response** shape. It carries no `password`, and must not grow one: a type the server
 * serialises to a client cannot be able to express a credential (D12). The two requests that
 * legitimately post one declare it themselves, below.
 */
type User = {
  _id?: string;
  username: string;
  role: 'admin' | 'editor' | 'collaborator';
  email: string;
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

/** The settings form genuinely posts a password change (`UserFormSidepanel.tsx:301`). */
type UpdateUserRequest = User & { password?: string };

type UpdateUserResponse = { user: Required<Pick<User, '_id' | 'email' | 'role' | 'username'>> };

type UnlockAccountRequest = { username: string; code: string };

type UnlockAccountResponse = string;

type UnlockBlockedUserRequest = { _id: string };

type UnlockBlockedUserResponse = string;

type LoginRequest = { username: string; password: string; token?: string };

type LoginResponse = { success: boolean };

type RecoverPasswordRequest = { email: string };

type RecoverPasswordResponse = string;

type ResetPasswordRequest = { key: string; password: string };

type ResetPasswordResponse = string;

type GenerateTwoFactorSecretResponse = { secret: string; otpauth: string };

type EnableTwoFactorAuthRequest = { token: string };

type EnableTwoFactorAuthResponse = { success: boolean };

type ResetTwoFactorAuthRequest = { _id: string };

type ResetTwoFactorAuthResponse = { success: boolean };

export type {
  User,
  GetUsersResponse,
  CreateUserResponse,
  CreateUserRequest,
  DeleteUserRequest,
  DeleteUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  UnlockAccountRequest,
  UnlockAccountResponse,
  UnlockBlockedUserRequest,
  UnlockBlockedUserResponse,
  LoginRequest,
  LoginResponse,
  RecoverPasswordRequest,
  RecoverPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  GenerateTwoFactorSecretResponse,
  EnableTwoFactorAuthRequest,
  EnableTwoFactorAuthResponse,
  ResetTwoFactorAuthRequest,
  ResetTwoFactorAuthResponse,
};
