import { IncomingHttpHeaders } from 'http';
import UsersAPI from 'app/Users/UsersAPI';
import { getGroups } from 'app/Users/components/usergroups/UserGroupsAPI';
import { RequestParams } from 'app/utils/RequestParams';

const get = async (headers?: IncomingHttpHeaders) => {
  const requestParams = new RequestParams({}, headers);
  const response = UsersAPI.get(requestParams);
  return response;
};

const getUserGroups = async (headers?: IncomingHttpHeaders) => {
  const requestParams = new RequestParams({}, headers);
  const response = getGroups(requestParams);
  return response;
};

export { get, getUserGroups };
