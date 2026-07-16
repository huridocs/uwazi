import type { IncomingHttpHeaders } from 'http';
import { ClientUserGroupSchema, ClientUserSchema } from '#app/apiResponseTypes.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import { apiClient } from '#V2/api/client.js';

const prepareUser = (user: ClientUserSchema & { rowId?: string }) => {
  const preparedUser = { ...user };
  delete preparedUser.rowId;

  if (!preparedUser.password) {
    delete preparedUser.password;
  }
  delete preparedUser.accountLocked;
  delete preparedUser.failedLogins;

  return preparedUser;
};

// Encode password to base64 to avoid special characters in the password
const encodePassword = (password: string) => Buffer.from(password).toString('base64');

const requestHeaders = (
  headers?: IncomingHttpHeaders,
  currentPassword?: string
): Record<string, string> | undefined => {
  const mapped = Object.fromEntries(
    Object.entries(headers ?? {}).filter((entry): entry is [string, string] => {
      const [, value] = entry;
      return typeof value === 'string';
    })
  );

  if (currentPassword) {
    mapped.authorization = `Basic ${encodePassword(currentPassword)}`;
  }

  return Object.keys(mapped).length > 0 ? mapped : undefined;
};

const newUser = async (
  user: ClientUserSchema,
  currentPassword: string,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<unknown>> =>
  apiClient.postJson('users/new', prepareUser(user), {
    headers: requestHeaders(headers, currentPassword),
  });

const updateUser = async (
  user: ClientUserSchema,
  currentPassword: string,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<unknown>> =>
  apiClient.postJson('users', prepareUser(user), {
    headers: requestHeaders(headers, currentPassword),
  });

const deleteUser = async (
  users: ClientUserSchema[],
  currentPassword: string,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<unknown>> =>
  apiClient.deleteJson(
    'users',
    { ids: users.map(user => user._id) },
    {
      headers: requestHeaders(headers, currentPassword),
    }
  );

const saveGroup = async (
  group: ClientUserGroupSchema & { rowId?: string },
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<unknown>> => {
  const { rowId, ...groupToSave } = group;
  return apiClient.postJson('usergroups', groupToSave, {
    headers: requestHeaders(headers),
  });
};

const deleteGroup = async (
  groups: ClientUserGroupSchema[],
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<unknown>> =>
  apiClient.deleteJson(
    'usergroups',
    { ids: groups.map(group => group._id) as string[] },
    { headers: requestHeaders(headers) }
  );

const unlockAccount = async (
  user: ClientUserSchema,
  currentPassword: string,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<unknown>> =>
  apiClient.postJson(
    'users/unlock',
    { _id: user._id },
    {
      headers: requestHeaders(headers, currentPassword),
    }
  );

const resetPassword = async (
  data: ClientUserSchema | ClientUserSchema[],
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<unknown>> => {
  const payloads = Array.isArray(data)
    ? data.map(user => ({ email: user.email }))
    : [{ email: data.email }];

  const responses = await Promise.all(
    payloads.map(async payload =>
      apiClient.postJson('recoverpassword', payload, { headers: requestHeaders(headers) })
    )
  );

  const error = responses.find(([, responseError]) => responseError)?.[1];
  if (error) return [undefined as never, error];

  return [responses.map(([responseData]) => responseData)];
};

const reset2FA = async (
  data: ClientUserSchema | ClientUserSchema[],
  currentPassword: string,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<unknown>> => {
  const payloads = Array.isArray(data)
    ? data.map(user => ({ _id: user._id }))
    : [{ _id: data._id }];
  const authHeaders = requestHeaders(headers, currentPassword);

  const responses = await Promise.all(
    payloads.map(async payload =>
      apiClient.postJson('auth2fa-reset', payload, { headers: authHeaders })
    )
  );

  const error = responses.find(([, responseError]) => responseError)?.[1];
  if (error) return [undefined as never, error];

  return [responses.map(([responseData]) => responseData)];
};

const get = async (headers?: IncomingHttpHeaders): Promise<ApiResponse<ClientUserSchema[]>> =>
  apiClient.getJson('users', {}, { headers: requestHeaders(headers) });

const getCurrentUser = async (
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<ClientUserSchema>> =>
  apiClient.getJson('user', {}, { headers: requestHeaders(headers) });

const getUserGroups = async (
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<ClientUserGroupSchema[]>> =>
  apiClient.getJson('usergroups', {}, { headers: requestHeaders(headers) });

const get2FASecret = async (
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<{ otpauth: string; secret: string }>> =>
  apiClient.postJson('auth2fa-secret', {}, { headers: requestHeaders(headers) });

const enable2FA = async (
  token: string,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<unknown>> =>
  apiClient.postJson('auth2fa-enable', { token }, { headers: requestHeaders(headers) });

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
  getCurrentUser,
  get2FASecret,
  enable2FA,
};
