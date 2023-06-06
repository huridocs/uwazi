import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { ClientUserGroupSchema } from 'app/apiResponseTypes';
import { ObjectIdSchema } from 'shared/types/commonTypes';

const getGroups = async (requestParams: RequestParams) => {
  const response = await api.get('usergroups', requestParams);
  return response.json;
};
const saveGroup = async (requestParams: RequestParams<ClientUserGroupSchema>) => {
  const response = await api.post('usergroups', requestParams);
  return response.json;
};
const deleteGroup = async (requestParams: RequestParams<{ ids: string[] }>) => {
  const response = await api.delete('usergroups', requestParams);
  return response.json;
};

export { getGroups, saveGroup, deleteGroup };
