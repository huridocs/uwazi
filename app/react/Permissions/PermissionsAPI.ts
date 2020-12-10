import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { MemberWithPermission } from './EntityPermisions';

export const searchContributors = async (value: string): Promise<MemberWithPermission[]> => {
  const response = await api.get('contributors', new RequestParams({ filterTerm: value }));
  return response.json;
};

export const loadGrantedPermissions = async (ids: string[]): Promise<MemberWithPermission[]> => {
  const response = await api.get('entities/permissions', new RequestParams({ id: ids[0] }));
  return response.json;
};
