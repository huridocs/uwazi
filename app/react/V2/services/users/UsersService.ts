import { IncomingHttpHeaders } from 'http';
import { ClientUserGroupSchema, ClientUserSchema } from '#app/apiResponseTypes.js';
import { ApiResponse } from '#V2/api/ApiResponse.js';
import { legacyApiCall } from '#V2/api/helpers.js';
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

const createUsersService = (): UsersService => ({
  get: headers => legacyApiCall(() => usersApi.get(headers)),
  getUserGroups: headers => legacyApiCall(() => usersApi.getUserGroups(headers)),
  getCurrentUser: headers => legacyApiCall(() => usersApi.getCurrentUser(headers)),
  newUser: (user, currentPassword, headers) =>
    legacyApiCall(() => usersApi.newUser(user, currentPassword, headers)),
  updateUser: (user, currentPassword, headers) =>
    legacyApiCall(() => usersApi.updateUser(user, currentPassword, headers)),
  deleteUser: (users, currentPassword, headers) =>
    legacyApiCall(() => usersApi.deleteUser(users, currentPassword, headers)),
  saveGroup: (group, headers) => legacyApiCall(() => usersApi.saveGroup(group, headers)),
  deleteGroup: (groups, headers) => legacyApiCall(() => usersApi.deleteGroup(groups, headers)),
  unlockAccount: (user, currentPassword, headers) =>
    legacyApiCall(() => usersApi.unlockAccount(user, currentPassword, headers)),
  resetPassword: (data, headers) => legacyApiCall(() => usersApi.resetPassword(data, headers)),
  reset2FA: (data, currentPassword, headers) =>
    legacyApiCall(() => usersApi.reset2FA(data, currentPassword, headers)),
});

export type { UsersService };
export { createUsersService };
