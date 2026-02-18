import { api } from '#app/utils/api.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { PermissionsDataSchema } from '#shared/types/permissionType.js';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';

export const searchCollaborators = async (value: string): Promise<MemberWithPermission[]> => {
  const response = await api.get('collaborators', new RequestParams({ filterTerm: value }));
  return response.json;
};

export const loadGrantedPermissions = async (
  sharedIds: string[]
): Promise<MemberWithPermission[]> => {
  const response = await api.put('entities/permissions', new RequestParams({ sharedIds }));
  return response.json;
};

export const savePermissions = async (
  permissionsData: PermissionsDataSchema
): Promise<PermissionsDataSchema> => {
  const response = await api.post('entities/permissions', new RequestParams(permissionsData));
  return response.json;
};
