import { ClientUserGroupSchema, ClientUserSchema } from '#app/apiResponseTypes.js';
import { ApiResponse } from '#V2/api/ApiResponse.js';
import type { ServiceRequestOptions } from './ServiceRequestOptions.js';

/**
 * Users and user-groups domain service.
 *
 * Follows the same read/write naming as other V2 services where applicable.
 * Domain-specific actions (unlock, password reset, 2FA) keep explicit names.
 */
interface UsersService {
  getAll(options?: ServiceRequestOptions): Promise<ApiResponse<ClientUserSchema[]>>;
  getCurrent(options?: ServiceRequestOptions): Promise<ApiResponse<ClientUserSchema>>;
  create(
    user: ClientUserSchema,
    currentPassword: string,
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<unknown>>;
  update(
    user: ClientUserSchema,
    currentPassword: string,
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<unknown>>;
  delete(
    users: ClientUserSchema[],
    currentPassword: string,
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<unknown>>;
  getAllGroups(options?: ServiceRequestOptions): Promise<ApiResponse<ClientUserGroupSchema[]>>;
  upsertGroup(
    group: ClientUserGroupSchema & { rowId?: string },
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<unknown>>;
  deleteGroups(
    groups: ClientUserGroupSchema[],
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

export type { UsersService };
