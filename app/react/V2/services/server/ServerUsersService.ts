import { UsersDAOFactory } from '#api/core/infrastructure/factories/UsersDAOFactory.js';
import type { User } from '#shared/contracts/Users.js';
import { ApiError } from '#shared/apiClient/ApiError.js';
import { toApiError } from '#shared/apiClient/index.js';
import type { UserSchema } from '#shared/types/userType.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type { UsersService } from '../contracts/UsersService.js';
import type { ServiceRequestOptions } from '../contracts/ServiceRequestOptions.js';
import { notImplemented } from './notImplemented.js';
import type { ServerServiceContext } from './types.js';

const mapUsers = (
  rows: Awaited<ReturnType<ReturnType<typeof UsersDAOFactory.default>['get']>>
): User[] =>
  rows.map(user => ({
    _id: user._id.toString(),
    username: user.username,
    role: user.role,
    email: user.email,
    groups: user.groups,
    using2fa: user.using2fa,
    accountLocked: user.accountLocked,
  }));

const mapCurrentUser = (user: UserSchema): User => ({
  _id: user._id?.toString(),
  username: user.username,
  role: user.role,
  email: user.email,
  groups: user.groups?.map(group => ({
    _id: group._id?.toString?.() ?? String(group._id),
    name: group.name,
  })),
  using2fa: user.using2fa,
  accountLocked: user.accountLocked,
});

const createServerUsersService = (ctx: ServerServiceContext): UsersService => ({
  getAll: async (_options?: ServiceRequestOptions): Promise<ApiResponse<User[]>> => {
    try {
      const rows = await UsersDAOFactory.default().get({});
      return [mapUsers(rows), undefined];
    } catch (e) {
      return [undefined as never, toApiError(e)];
    }
  },

  getCurrent: async (): Promise<ApiResponse<User>> => {
    if (!ctx.user?._id) {
      return [
        undefined as never,
        new ApiError('Unauthorized', {
          kind: 'http',
          status: 401,
          code: 'UNAUTHORIZED',
        }),
      ];
    }

    return [mapCurrentUser(ctx.user), undefined];
  },

  upsert: async () => notImplemented<unknown>(),

  delete: async () => notImplemented<unknown>(),

  unlockAccount: async () => notImplemented<unknown>(),

  requestPasswordReset: async () => notImplemented<unknown>(),

  reset2FA: async () => notImplemented<unknown>(),

  get2FASecret: async () => notImplemented(),

  enable2FA: async () => notImplemented<unknown>(),
});

export { createServerUsersService };
