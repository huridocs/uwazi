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
  getAll: ({ headers } = {}) => fromLegacyApi(() => usersApi.get(headers)),
  getCurrent: ({ headers } = {}) => fromLegacyApi(() => usersApi.getCurrentUser(headers)),
  upsert: (user, currentPassword, { headers } = {}) =>
    user._id
      ? fromLegacyApi(() => usersApi.updateUser(user, currentPassword, headers))
      : fromLegacyApi(() => usersApi.newUser(user, currentPassword, headers)),
  delete: (users, currentPassword, { headers } = {}) =>
    fromLegacyApi(() => usersApi.deleteUser(users, currentPassword, headers)),
  unlockAccount: (user, currentPassword, { headers } = {}) =>
    fromLegacyApi(() => usersApi.unlockAccount(user, currentPassword, headers)),
  requestPasswordReset: (data, { headers } = {}) =>
    fromLegacyApi(() => usersApi.resetPassword(data, headers)),
  reset2FA: (data, currentPassword, { headers } = {}) =>
    fromLegacyApi(() => usersApi.reset2FA(data, currentPassword, headers)),
};

export { httpUsersService };
