import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { ObjectIdSchema } from 'shared/types/commonTypes';

const getGroups = async (requestParams: RequestParams<UserGroupSchema>) => {
  const response = await api.get('usergroups', requestParams);
  return response.json;
};
const saveGroup = async (requestParams: RequestParams<UserGroupSchema>) => {
  const response = await api.post('usergroups', requestParams);
  return response.json;
};
const deleteGroup = async (requestParams: RequestParams<{ _id: ObjectIdSchema }>) => {
  const response = await api.delete('usergroups', requestParams);
  return response.json;
};

export { getGroups, saveGroup, deleteGroup };
