import { IncomingHttpHeaders } from 'http';
import { RequestParams } from '#app/utils/RequestParams.js';
import { api } from '#app/utils/api.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { ApiResponse } from '../ApiResponse';
import type { SyncConfigForm, SyncConfigPublic } from '#V2/Routes/Settings/Sync/types.js';

const getSync = async (
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<SyncConfigPublic[] | undefined, FetchResponseError>> => {
  try {
    const requestParams = new RequestParams({}, headers);
    const response = await api.get('settings/sync', requestParams);
    return [response.json, undefined];
  } catch (e) {
    return [undefined, e];
  }
};

const saveSync = async (
  sync: SyncConfigForm[],
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<SyncConfigPublic[] | undefined, FetchResponseError>> => {
  try {
    const requestParams = new RequestParams(sync, headers);
    const response = await api.put('settings/sync', requestParams);
    return [response.json, undefined];
  } catch (e) {
    return [undefined, e];
  }
};

export { getSync, saveSync };
