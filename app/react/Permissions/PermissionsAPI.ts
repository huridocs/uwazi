import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { PermissionsDataSchema } from 'shared/types/permissionType';
import { MemberWithPermission } from 'shared/types/entityPermisions';

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
