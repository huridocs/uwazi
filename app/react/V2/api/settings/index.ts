import { IncomingHttpHeaders } from 'http';
// @ts-expect-error TS(2307): Cannot find module '../../Settings.js' or its corr... Remove this comment to see the full error message
import { SettingsAPI } from '../../Settings.js';
// @ts-expect-error TS(2307): Cannot find module '../../utils/RequestParams.js' ... Remove this comment to see the full error message
import { RequestParams } from '../../utils/RequestParams.js';
// @ts-expect-error TS(2307): Cannot find module '../../apiResponseTypes.js' or ... Remove this comment to see the full error message
import { ClientSettings, ClientSettingsLinkSchema } from '../../apiResponseTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/JSONRequest.js' o... Remove this comment to see the full error message
import { FetchResponseError } from 'shared/JSONRequest.js';
// @ts-expect-error TS(2307): Cannot find module '../../utils/api.js' or its cor... Remove this comment to see the full error message
import api from '../../utils/api.js';

const get = async (headers?: IncomingHttpHeaders): Promise<ClientSettings> => {
  const requestParams = new RequestParams({}, headers);
  return SettingsAPI.get(requestParams);
};

const save = async (
  settings: ClientSettings,
  headers?: IncomingHttpHeaders
): Promise<ClientSettings | FetchResponseError> => {
  const requestParams = new RequestParams(settings, headers);
  return SettingsAPI.save(requestParams);
};

const getLinks = async (headers?: IncomingHttpHeaders): Promise<ClientSettingsLinkSchema[]> => {
  const requestParams = new RequestParams({}, headers);
  return api.get('settings/links', requestParams).then((response: any) => response.json);
};

const saveLinks = async (links: ClientSettingsLinkSchema[], headers?: IncomingHttpHeaders) => {
  const requestParams = new RequestParams(links, headers);
  return api.post('settings/links', requestParams).then((response: any) => response.json);
};

const getStats = async (headers?: IncomingHttpHeaders) => {
  const requestParams = new RequestParams({}, headers);
  return api.get('stats', requestParams).then((response: any) => response.json);
};

export { get, save, getLinks, saveLinks, getStats };
