import type { IncomingHttpHeaders } from 'http';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { PermissionsDataSchema } from '#shared/types/permissionType.js';
import { ApiResponse } from '../ApiResponse.js';
import { apiClient } from '../client.js';

const requestHeaders = (headers?: IncomingHttpHeaders): Record<string, string> | undefined => {
  const mapped = Object.fromEntries(
    Object.entries(headers ?? {}).filter((entry): entry is [string, string] => {
      const [, value] = entry;
      return typeof value === 'string';
    })
  );
  return Object.keys(mapped).length > 0 ? mapped : undefined;
};

const getPermissions = async (
  sharedIds: string[],
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<MemberWithPermission[]>> =>
  apiClient.putJson<MemberWithPermission[]>('entities/permissions', { sharedIds }, {
    headers: requestHeaders(headers),
  });

const savePermissions = async (
  permissionsData: PermissionsDataSchema,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<PermissionsDataSchema>> =>
  apiClient.postJson<PermissionsDataSchema>('entities/permissions', permissionsData, {
    headers: requestHeaders(headers),
  });

const searchCollaborators = async (
  filterTerm: string,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<MemberWithPermission[]>> =>
  apiClient.getJson<MemberWithPermission[]>('collaborators', { filterTerm }, {
    headers: requestHeaders(headers),
  });

export { getPermissions, savePermissions, searchCollaborators };
