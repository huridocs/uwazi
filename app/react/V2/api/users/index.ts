import { IncomingHttpHeaders } from 'http';
import UsersAPI from 'app/Users/UsersAPI';
import * as GroupsAPI from 'app/Users/components/usergroups/UserGroupsAPI';
import { RequestParams } from 'app/utils/RequestParams';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';

const newUser = async (user: ClientUserSchema, headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams(user, headers);
    return await UsersAPI.new(requestParams);
  } catch (e) {
    return e;
  }
};

const saveUser = async (user: ClientUserSchema, headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams(user, headers);
    return UsersAPI.save(requestParams);
  } catch (e) {
    return e;
  }
};

const deleteUser = async (users: ClientUserSchema[], headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams({ ids: users.map(user => user._id) }, headers);
    return UsersAPI.delete(requestParams);
  } catch (e) {
    return e;
  }
};

const saveGroup = async (group: ClientUserGroupSchema, headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams(group, headers);
    return GroupsAPI.saveGroup(requestParams);
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
    return GroupsAPI.deleteGroup(requestParams);
  } catch (e) {
    return e;
  }
};

const get = async (headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams({}, headers);
    return UsersAPI.get(requestParams);
  } catch (e) {
    return e;
  }
};

const getUserGroups = async (headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams({}, headers);
    return GroupsAPI.getGroups(requestParams);
  } catch (e) {
    return e;
  }
};

export { get, getUserGroups, newUser, saveUser, deleteUser, saveGroup, deleteGroup };
