import { UserGroupsQueryServiceFactory } from '#api/core/infrastructure/factories/UserGroupsQueryServiceFactory.js';
import type { GetUserGroupsResponse, UserGroup } from '#shared/contracts/UserGroups.js';
import { toApiError } from '#shared/apiClient/index.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type { UserGroupsService } from '../contracts/UserGroupsService.js';
import type { ServiceRequestOptions } from '../contracts/ServiceRequestOptions.js';
import { notImplemented } from './notImplemented.js';
import type { ServerServiceContext } from './types.js';

const createServerUserGroupsService = (_ctx: ServerServiceContext): UserGroupsService => ({
  getAll: async (_options?: ServiceRequestOptions): Promise<ApiResponse<UserGroup[]>> => {
    try {
      const groups = await UserGroupsQueryServiceFactory.default().listUserGroups();

      const response: GetUserGroupsResponse = groups;

      return [response as UserGroup[], undefined];
    } catch (e) {
      return [undefined as never, toApiError(e)];
    }
  },

  upsert: async () => notImplemented<unknown>(),

  delete: async () => notImplemented<unknown>(),
});

export { createServerUserGroupsService };
