import { fromLegacyApi } from '#shared/apiClient/index.js';
import * as usersApi from '#V2/api/users/index.js';
import type { UserGroupsService } from '../contracts/UserGroupsService.js';

const httpUserGroupsService: UserGroupsService = {
  getAll: async ({ headers } = {}) => fromLegacyApi(async () => usersApi.getUserGroups(headers)),
  upsert: async (group, { headers } = {}) =>
    fromLegacyApi(async () => usersApi.saveGroup(group, headers)),
  delete: async (groups, { headers } = {}) =>
    fromLegacyApi(async () => usersApi.deleteGroup(groups, headers)),
};

export { httpUserGroupsService };
