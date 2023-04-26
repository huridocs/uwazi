import { IncomingHttpHeaders } from 'http';
import { SettingsAPI } from 'app/Settings';
import { RequestParams } from 'app/utils/RequestParams';

const get = async (headers?: IncomingHttpHeaders) => {
  const requestParams = new RequestParams({}, headers);
  const response = SettingsAPI.get(requestParams);
  return response;
};

export { get };
