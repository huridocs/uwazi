import { IncomingHttpHeaders } from 'http';
import UsersAPI from 'app/Users/UsersAPI';
import * as GroupsAPI from 'app/Users/components/usergroups/UserGroupsAPI';
import { RequestParams } from 'app/utils/RequestParams';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';

const newUser = async (user: ClientUserSchema, headers?: IncomingHttpHeaders) => {
  const requestParams = new RequestParams(user, headers);
  const createdUser = await UsersAPI.new(requestParams);
  return createdUser;
};

const saveUser = async (user: ClientUserSchema, headers?: IncomingHttpHeaders) => {
  const requestParams = new RequestParams(user, headers);
  const savedUser = await UsersAPI.save(requestParams);
  return savedUser;
};

const deleteUser = async (users: ClientUserSchema[], headers?: IncomingHttpHeaders) => {
  const requestParams = new RequestParams({ ids: users.map(user => user._id) }, headers);
  const savedUser = await UsersAPI.delete(requestParams);
  return savedUser;
};

const saveGroup = async (group: ClientUserGroupSchema, headers?: IncomingHttpHeaders) => {
  const requestParams = new RequestParams(group, headers);
  const savedGroup = await GroupsAPI.saveGroup(requestParams);
  return savedGroup;
};

const deleteGroup = async (groups: ClientUserGroupSchema[], headers?: IncomingHttpHeaders) => {
  const requestParams = new RequestParams(
    { ids: groups.map(group => group._id) as string[] },
    headers
  );
  const deletedGroup = await GroupsAPI.deleteGroup(requestParams);
  return deletedGroup;
};

const get = async (headers?: IncomingHttpHeaders) => {
  const requestParams = new RequestParams({}, headers);
  const response = UsersAPI.get(requestParams);
  return response;
};

const getUserGroups = async (headers?: IncomingHttpHeaders) => {
  const requestParams = new RequestParams({}, headers);
  const response = GroupsAPI.getGroups(requestParams);
  return response;
};

export { get, getUserGroups, newUser, saveUser, deleteUser, saveGroup, deleteGroup };
