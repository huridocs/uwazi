import type { User, UpdateUserRequest } from '#shared/contracts/Users.js';
import { ApiResponse } from '#V2/api/ApiResponse.js';
import type { ServiceRequestOptions } from './ServiceRequestOptions.js';

/**
 * Built on the request type, not the response type: `upsert` is the write path, and it is
 * where the settings form's password change travels (D12).
 */
type UserInput = UpdateUserRequest & { rowId?: string };

type TwoFactorSecret = {
  otpauth: string;
  secret: string;
};

/**
 * Users domain service.
 *
 * Standard reads: `getAll`, `getCurrent`.
 * Standard writes: `upsert`, `delete`.
 * Domain actions (`unlockAccount`, etc.) are user-specific operations beyond CRUD.
 */
interface UsersService {
  getAll(options?: ServiceRequestOptions): Promise<ApiResponse<User[]>>;
  getCurrent(options?: ServiceRequestOptions): Promise<ApiResponse<User>>;
  get2FASecret(options?: ServiceRequestOptions): Promise<ApiResponse<TwoFactorSecret>>;
  upsert(
    user: UserInput,
    currentPassword: string,
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<unknown>>;
  delete(
    users: User[],
    currentPassword: string,
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<unknown>>;
  unlockAccount(
    user: User,
    currentPassword: string,
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<unknown>>;
  requestPasswordReset(
    data: User | User[],
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<unknown>>;
  reset2FA(
    data: User | User[],
    currentPassword: string,
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<unknown>>;
  enable2FA(token: string, options?: ServiceRequestOptions): Promise<ApiResponse<unknown>>;
}

export type { UsersService, UserInput, TwoFactorSecret };
