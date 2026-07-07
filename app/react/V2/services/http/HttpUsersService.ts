import { ApiResponse } from '#V2/api/ApiResponse.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import * as usersApi from '#V2/api/users/index.js';
import type { UsersService } from '../contracts/UsersService.js';

const isFetchResponseError = (value: unknown): value is FetchResponseError =>
  value instanceof Error && 'status' in value;

/** Legacy users API returns errors as values instead of throwing. */
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

const httpUsersService: UsersService = {
  getAll: async ({ headers } = {}) => fromLegacyApi(async () => usersApi.get(headers)),
  getCurrent: async ({ headers } = {}) =>
    fromLegacyApi(async () => usersApi.getCurrentUser(headers)),
  upsert: async (user, currentPassword, { headers } = {}) =>
    user._id
      ? fromLegacyApi(async () => usersApi.updateUser(user, currentPassword, headers))
      : fromLegacyApi(async () => usersApi.newUser(user, currentPassword, headers)),
  delete: async (users, currentPassword, { headers } = {}) =>
    fromLegacyApi(async () => usersApi.deleteUser(users, currentPassword, headers)),
  unlockAccount: async (user, currentPassword, { headers } = {}) =>
    fromLegacyApi(async () => usersApi.unlockAccount(user, currentPassword, headers)),
  requestPasswordReset: async (data, { headers } = {}) =>
    fromLegacyApi(async () => usersApi.resetPassword(data, headers)),
  reset2FA: async (data, currentPassword, { headers } = {}) =>
    fromLegacyApi(async () => usersApi.reset2FA(data, currentPassword, headers)),
};

export { httpUsersService };
