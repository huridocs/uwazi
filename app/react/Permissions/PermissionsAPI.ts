import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { MemberWithPermission } from './EntityPermisions';
import { PermissionsSchema } from '../../shared/types/permissionsType';

export const searchContributors = async (value: string): Promise<MemberWithPermission[]> => {
  const response = await api.get('contributors', new RequestParams({ filterTerm: value }));
  return response.json;
};

export const loadGrantedPermissions = async (
  sharedIds: string[]
): Promise<MemberWithPermission[]> => {
  const response = await api.get('entities/permissions', new RequestParams({ id: sharedIds }));
  return response.json;
};

export const savePermissions = async (ids: string[], permissions: PermissionsSchema) => {
  const response = await api.post(
    'entities/permissions',
    new RequestParams({
      ids,
      permissions,
    })
  );
  return response.json;
};
