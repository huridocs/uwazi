import { IncomingHttpHeaders } from 'http';
import { SettingsAPI } from 'app/Settings';
import { RequestParams } from 'app/utils/RequestParams';
import { ClientSettings, ClientSettingsLinkSchema } from 'app/apiResponseTypes';
import { FetchResponseError } from 'shared/JSONRequest';
import api from 'app/utils/api';

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
