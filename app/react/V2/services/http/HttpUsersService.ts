import * as usersApi from '#V2/api/users/index.js';
import type { UsersService } from '../contracts/UsersService.js';

const httpUsersService: UsersService = {
  getAll: async ({ headers } = {}) => usersApi.get(headers),
  getCurrent: async ({ headers } = {}) => usersApi.getCurrentUser(headers),
  upsert: async (user, currentPassword, { headers } = {}) =>
    user._id
      ? usersApi.updateUser(user, currentPassword, headers)
      : usersApi.newUser(user, currentPassword, headers),
  delete: async (users, currentPassword, { headers } = {}) =>
    usersApi.deleteUser(users, currentPassword, headers),
  unlockAccount: async (user, currentPassword, { headers } = {}) =>
    usersApi.unlockAccount(user, currentPassword, headers),
  requestPasswordReset: async (data, { headers } = {}) => usersApi.resetPassword(data, headers),
  reset2FA: async (data, currentPassword, { headers } = {}) =>
    usersApi.reset2FA(data, currentPassword, headers),
  get2FASecret: async ({ headers } = {}) => usersApi.get2FASecret(headers),
  enable2FA: async (token, { headers } = {}) => usersApi.enable2FA(token, headers),
};

export { httpUsersService };
