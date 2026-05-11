import { IncomingHttpHeaders } from 'http';
import { SettingsAPI } from '#app/Settings/index.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { ClientSettings, ClientSettingsLinkSchema } from '#app/apiResponseTypes.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { api } from '#app/utils/api.js';
import { ApiResponse } from '../ApiResponse';
import { CollectionStats } from './types';

const get = async (
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<ClientSettings | undefined, FetchResponseError>> => {
  try {
    const requestParams = new RequestParams({}, headers);
    const response = await SettingsAPI.get(requestParams);
    return [response, undefined];
  } catch (e) {
    return [undefined, e];
  }
};

const save = async (
  settings: ClientSettings,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<ClientSettings | undefined, FetchResponseError>> => {
  try {
    const requestParams = new RequestParams(settings, headers);
    const response = await SettingsAPI.save(requestParams);
    return [response, undefined];
  } catch (e) {
    return [undefined, e];
  }
};

const getLinks = async (
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<ClientSettingsLinkSchema[] | undefined, FetchResponseError>> => {
  try {
    const requestParams = new RequestParams({}, headers);
    const response = await api.get('settings/links', requestParams);
    return [response.json, undefined];
  } catch (e) {
    return [undefined, e];
  }
};

const saveLinks = async (
  links: ClientSettingsLinkSchema[],
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<ClientSettings | undefined, FetchResponseError>> => {
  try {
    const requestParams = new RequestParams(links, headers);
    const response = await api.post('settings/links', requestParams);
    return [response.json, undefined];
  } catch (e) {
    return [undefined, e];
  }
};

const getStats = async (
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<CollectionStats | undefined, FetchResponseError>> => {
  try {
    const requestParams = new RequestParams({}, headers);
    const response = await api.get('stats', requestParams);
    return [response.json, undefined];
  } catch (e) {
    return [undefined, e];
  }
};

export { get, save, getLinks, saveLinks, getStats };
