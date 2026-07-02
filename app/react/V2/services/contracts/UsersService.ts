import { ClientUserSchema } from '#app/apiResponseTypes.js';
import { ApiResponse } from '#V2/api/ApiResponse.js';
import type { ServiceRequestOptions } from './ServiceRequestOptions.js';

type UserInput = ClientUserSchema & { rowId?: string };

/**
 * Users domain service.
 *
 * Standard reads: `getAll`, `getCurrent`.
 * Standard writes: `upsert`, `delete`.
 * Domain actions (`unlockAccount`, etc.) are user-specific operations beyond CRUD.
 */
interface UsersService {
  getAll(options?: ServiceRequestOptions): Promise<ApiResponse<ClientUserSchema[]>>;
  getCurrent(options?: ServiceRequestOptions): Promise<ApiResponse<ClientUserSchema>>;
  upsert(
    user: UserInput,
    currentPassword: string,
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<unknown>>;
  delete(
    users: ClientUserSchema[],
    currentPassword: string,
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<unknown>>;
  unlockAccount(
    user: ClientUserSchema,
    currentPassword: string,
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<unknown>>;
  requestPasswordReset(
    data: ClientUserSchema | ClientUserSchema[],
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<unknown>>;
  reset2FA(
    data: ClientUserSchema | ClientUserSchema[],
    currentPassword: string,
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<unknown>>;
}

export type { UsersService, UserInput };
