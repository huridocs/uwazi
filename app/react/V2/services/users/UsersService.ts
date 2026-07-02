import { IncomingHttpHeaders } from 'http';
import { ClientUserGroupSchema, ClientUserSchema } from '#app/apiResponseTypes.js';
import { ApiResponse } from '#V2/api/ApiResponse.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import * as usersApi from '#V2/api/users/index.js';

interface UsersService {
  get(headers?: IncomingHttpHeaders): Promise<ApiResponse<ClientUserSchema[]>>;
  getUserGroups(headers?: IncomingHttpHeaders): Promise<ApiResponse<ClientUserGroupSchema[]>>;
  getCurrentUser(headers?: IncomingHttpHeaders): Promise<ApiResponse<ClientUserSchema>>;
  newUser(
    user: ClientUserSchema,
    currentPassword: string,
    headers?: IncomingHttpHeaders
  ): Promise<ApiResponse<unknown>>;
  updateUser(
    user: ClientUserSchema,
    currentPassword: string,
    headers?: IncomingHttpHeaders
  ): Promise<ApiResponse<unknown>>;
  deleteUser(
    users: ClientUserSchema[],
    currentPassword: string,
    headers?: IncomingHttpHeaders
  ): Promise<ApiResponse<unknown>>;
  saveGroup(
    group: ClientUserGroupSchema & { rowId?: string },
    headers?: IncomingHttpHeaders
  ): Promise<ApiResponse<unknown>>;
  deleteGroup(
    groups: ClientUserGroupSchema[],
    headers?: IncomingHttpHeaders
  ): Promise<ApiResponse<unknown>>;
  unlockAccount(
    user: ClientUserSchema,
    currentPassword: string,
    headers?: IncomingHttpHeaders
  ): Promise<ApiResponse<unknown>>;
  resetPassword(
    data: ClientUserSchema | ClientUserSchema[],
    headers?: IncomingHttpHeaders
  ): Promise<ApiResponse<unknown>>;
  reset2FA(
    data: ClientUserSchema | ClientUserSchema[],
    currentPassword: string,
    headers?: IncomingHttpHeaders
  ): Promise<ApiResponse<unknown>>;
}

const isFetchResponseError = (value: unknown): value is FetchResponseError =>
  value instanceof Error && 'status' in value;

/** users API returns errors as values instead of throwing */
const fromLegacyApi = async <T>(
  fn: () => Promise<T | FetchResponseError>
): Promise<ApiResponse<T, FetchResponseError>> => {
  try {
    const result = await fn();
    if (isFetchResponseError(result)) {
      return [undefined as T, result];
    }
    return [result as T];
  } catch (e) {
    return [undefined as T, e as FetchResponseError];
  }
};

const createUsersService = (): UsersService => ({
  get: headers => fromLegacyApi(() => usersApi.get(headers)),
  getUserGroups: headers => fromLegacyApi(() => usersApi.getUserGroups(headers)),
  getCurrentUser: headers => fromLegacyApi(() => usersApi.getCurrentUser(headers)),
  newUser: (user, currentPassword, headers) =>
    fromLegacyApi(() => usersApi.newUser(user, currentPassword, headers)),
  updateUser: (user, currentPassword, headers) =>
    fromLegacyApi(() => usersApi.updateUser(user, currentPassword, headers)),
  deleteUser: (users, currentPassword, headers) =>
    fromLegacyApi(() => usersApi.deleteUser(users, currentPassword, headers)),
  saveGroup: (group, headers) => fromLegacyApi(() => usersApi.saveGroup(group, headers)),
  deleteGroup: (groups, headers) => fromLegacyApi(() => usersApi.deleteGroup(groups, headers)),
  unlockAccount: (user, currentPassword, headers) =>
    fromLegacyApi(() => usersApi.unlockAccount(user, currentPassword, headers)),
  resetPassword: (data, headers) => fromLegacyApi(() => usersApi.resetPassword(data, headers)),
  reset2FA: (data, currentPassword, headers) =>
    fromLegacyApi(() => usersApi.reset2FA(data, currentPassword, headers)),
});

export type { UsersService };
export { createUsersService };
