import type { UserGroup } from '#shared/contracts/Users.js';
import { ApiResponse } from '#V2/api/ApiResponse.js';
import type { ServiceRequestOptions } from './ServiceRequestOptions.js';

type UserGroupInput = UserGroup & { rowId?: string };

/**
 * User groups domain service.
 *
 * Standard reads: `getAll`.
 * Standard writes: `upsert`, `delete`.
 */
interface UserGroupsService {
  getAll(options?: ServiceRequestOptions): Promise<ApiResponse<UserGroup[]>>;
  upsert(group: UserGroupInput, options?: ServiceRequestOptions): Promise<ApiResponse<unknown>>;
  delete(groups: UserGroup[], options?: ServiceRequestOptions): Promise<ApiResponse<unknown>>;
}

export type { UserGroupsService, UserGroupInput };
