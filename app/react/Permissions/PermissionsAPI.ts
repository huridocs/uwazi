// @ts-expect-error TS(2307): Cannot find module '../../utils/api.js' or its cor... Remove this comment to see the full error message
import api from '../../utils/api.js';
// @ts-expect-error TS(2307): Cannot find module '../../utils/RequestParams.js' ... Remove this comment to see the full error message
import { RequestParams } from '../../utils/RequestParams.js';
import { PermissionsDataSchema } from 'shared/types/permissionType.js';
import { MemberWithPermission } from 'shared/types/entityPermisions.js';

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
