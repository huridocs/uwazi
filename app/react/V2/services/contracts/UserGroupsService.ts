import { ClientUserGroupSchema } from '#app/apiResponseTypes.js';
import { ApiResponse } from '#V2/api/ApiResponse.js';
import type { ServiceRequestOptions } from './ServiceRequestOptions.js';

type UserGroupInput = ClientUserGroupSchema & { rowId?: string };

/**
 * User groups domain service.
 *
 * Standard reads: `getAll`.
 * Standard writes: `upsert`, `delete`.
 */
interface UserGroupsService {
  getAll(options?: ServiceRequestOptions): Promise<ApiResponse<ClientUserGroupSchema[]>>;
  upsert(
    group: UserGroupInput,
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<unknown>>;
  delete(
    groups: ClientUserGroupSchema[],
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<unknown>>;
}

export type { UserGroupsService, UserGroupInput };
