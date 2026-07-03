import { ApiResponse } from '#V2/api/ApiResponse.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import * as usersApi from '#V2/api/users/index.js';
import type { UserGroupsService } from '../contracts/UserGroupsService.js';

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

const httpUserGroupsService: UserGroupsService = {
  getAll: ({ headers } = {}) => fromLegacyApi(() => usersApi.getUserGroups(headers)),
  upsert: (group, { headers } = {}) => fromLegacyApi(() => usersApi.saveGroup(group, headers)),
  delete: (groups, { headers } = {}) => fromLegacyApi(() => usersApi.deleteGroup(groups, headers)),
};

export { httpUserGroupsService };
