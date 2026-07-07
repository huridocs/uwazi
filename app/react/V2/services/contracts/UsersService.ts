import type { User } from '#shared/contracts/Users.js';
import { ApiResponse } from '#V2/api/ApiResponse.js';
import type { ServiceRequestOptions } from './ServiceRequestOptions.js';

type UserInput = User & { rowId?: string };

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
}

export type { UsersService, UserInput };
