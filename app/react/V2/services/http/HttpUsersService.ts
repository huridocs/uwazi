import { fromLegacyApi } from '#shared/apiClient/index.js';
import * as usersApi from '#V2/api/users/index.js';
import type { UsersService } from '../contracts/UsersService.js';

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
