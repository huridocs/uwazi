import { IncomingHttpHeaders } from 'http';
import UsersAPI from 'app/Users/UsersAPI';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';

const prepareUser = (user: ClientUserSchema) => {
  const preparedUser = { ...user };

  if (!preparedUser.password) {
    delete preparedUser.password;
  }
  delete preparedUser.accountLocked;
  delete preparedUser.failedLogins;

  return preparedUser;
};

const newUser = async (user: ClientUserSchema, headers?: IncomingHttpHeaders) => {
  try {
    const createdUser = prepareUser(user);
    const requestParams = new RequestParams(createdUser, headers);
    const response = await UsersAPI.new(requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const updateUser = async (user: ClientUserSchema, headers?: IncomingHttpHeaders) => {
  try {
    const updatedUser = prepareUser(user);
    const requestParams = new RequestParams(updatedUser, headers);
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
    const response = await api.post('usergroups', requestParams);
    return response.json;
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
    const response = await api.delete('usergroups', requestParams);
    return response.json;
  } catch (e) {
    return e;
  }
};

const unlockAccount = async (user: ClientUserSchema, headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams({ _id: user._id }, headers);
    const response = await UsersAPI.unlockAccount(requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const resetPassword = async (
  data: ClientUserSchema | ClientUserSchema[],
  headers?: IncomingHttpHeaders
) => {
  try {
    if (Array.isArray(data)) {
      const response = await Promise.all(
        data.map(user => {
          const requestParams = new RequestParams({ email: user.email }, headers);
          return api.post('recoverpassword', requestParams);
        })
      );
      return response;
    }

    const requestParams = new RequestParams({ email: data.email }, headers);
    const response = await api.post('recoverpassword', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const reset2FA = async (
  data: ClientUserSchema | ClientUserSchema[],
  headers?: IncomingHttpHeaders
) => {
  try {
    if (Array.isArray(data)) {
      const response = await Promise.all(
        data.map(user => {
          const requestParams = new RequestParams({ _id: user._id }, headers);
          return api.post('auth2fa-reset', requestParams);
        })
      );
      return response;
    }

    const requestParams = new RequestParams({ _id: data._id }, headers);
    const response = await api.post('auth2fa-reset', requestParams);
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
    const response = await api.get('usergroups', requestParams);
    return response.json;
  } catch (e) {
    return e;
  }
};

export {
  get,
  getUserGroups,
  newUser,
  updateUser,
  deleteUser,
  saveGroup,
  deleteGroup,
  unlockAccount,
  resetPassword,
  reset2FA,
};
