import { IncomingHttpHeaders } from 'http';
import UsersAPI from 'app/Users/UsersAPI';
import * as GroupsAPI from 'app/Users/components/usergroups/UserGroupsAPI';
import { RequestParams } from 'app/utils/RequestParams';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';

const newUser = async (user: ClientUserSchema, headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams(user, headers);
    const response = await UsersAPI.new(requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const saveUser = async (user: ClientUserSchema, headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams(user, headers);
    const response = await UsersAPI.save(requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const deleteUser = async (users: ClientUserSchema[], headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams({ ids: users.map(user => user._id) }, headers);
    const response = await UsersAPI.delete(requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const saveGroup = async (group: ClientUserGroupSchema, headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams(group, headers);
    const response = await GroupsAPI.saveGroup(requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const deleteGroup = async (groups: ClientUserGroupSchema[], headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams(
      { ids: groups.map(group => group._id) as string[] },
      headers
    );
    const response = await GroupsAPI.deleteGroup(requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const unlockAccount = async (user: ClientUserSchema, headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams({ id: user._id }, headers);
    const response = await UsersAPI.unlockAccount(requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const get = async (headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams({}, headers);
    const response = await UsersAPI.get(requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const getUserGroups = async (headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams({}, headers);
    const response = await GroupsAPI.getGroups(requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

export { get, getUserGroups, newUser, saveUser, deleteUser, saveGroup, deleteGroup, unlockAccount };
