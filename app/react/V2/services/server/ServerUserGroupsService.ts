import userGroups from '#api/usergroups/userGroups.js';
import type { UserGroup } from '#shared/contracts/Users.js';
import { toApiError } from '#shared/apiClient/index.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type { UserGroupsService } from '../contracts/UserGroupsService.js';
import type { ServiceRequestOptions } from '../contracts/ServiceRequestOptions.js';
import { notImplemented } from './notImplemented.js';
import type { ServerServiceContext } from './types.js';

/** Mongo ObjectIds → strings, matching HTTP JSON serialization. */
const serializeGroups = (rows: unknown[]): UserGroup[] => JSON.parse(JSON.stringify(rows));

const createServerUserGroupsService = (_ctx: ServerServiceContext): UserGroupsService => ({
  getAll: async (_options?: ServiceRequestOptions): Promise<ApiResponse<UserGroup[]>> => {
    try {
      const rows = await userGroups.get({});
      return [serializeGroups(rows), undefined];
    } catch (e) {
      return [undefined as never, toApiError(e)];
    }
  },

  upsert: async () => notImplemented<unknown>(),

  delete: async () => notImplemented<unknown>(),
});

export { createServerUserGroupsService };
