import type { IncomingHttpHeaders } from 'http';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { PermissionsDataSchema } from '#shared/types/permissionType.js';
import { ApiResponse } from '../ApiResponse.js';
import { apiClient } from '../client.js';
import { requestHeaders } from '../requestHeaders.js';

const withHeaders = (headers?: IncomingHttpHeaders) => ({ headers: requestHeaders(headers) });

const getPermissions = async (
  sharedIds: string[],
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<MemberWithPermission[]>> =>
  apiClient.putJson<MemberWithPermission[]>(
    'entities/permissions',
    { sharedIds },
    withHeaders(headers)
  );

const savePermissions = async (
  permissionsData: PermissionsDataSchema,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<PermissionsDataSchema>> =>
  apiClient.postJson<PermissionsDataSchema>(
    'entities/permissions',
    permissionsData,
    withHeaders(headers)
  );

const searchCollaborators = async (
  filterTerm: string,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<MemberWithPermission[]>> =>
  apiClient.getJson<MemberWithPermission[]>('collaborators', { filterTerm }, withHeaders(headers));

export { getPermissions, savePermissions, searchCollaborators };
