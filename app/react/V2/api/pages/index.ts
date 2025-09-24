import { IncomingHttpHeaders } from 'http';
// @ts-expect-error TS(2307): Cannot find module '../../utils/api.js' or its cor... Remove this comment to see the full error message
import api from '../../utils/api.js';
// @ts-expect-error TS(2307): Cannot find module '../../utils/RequestParams.js' ... Remove this comment to see the full error message
import { RequestParams } from '../../utils/RequestParams.js';
import { Page } from 'shared/types.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/JSONRequest.js' o... Remove this comment to see the full error message
import { FetchResponseError } from 'shared/JSONRequest.js';

const get = async (headers?: IncomingHttpHeaders): Promise<Page[]> => {
  try {
    const requestParams = new RequestParams({}, headers);
    if (headers && headers['Content-Language']) {
      api.locale(headers['Content-Language']);
    }
    const response = await api.get('pages', requestParams);
    return response.json;
  } catch (e) {
    return e;
  }
};

const getBySharedId = async (sharedId: string, headers?: IncomingHttpHeaders): Promise<Page> => {
  try {
    const requestParams = new RequestParams({ sharedId }, headers);
    if (headers && headers['Content-Language']) {
      api.locale(headers['Content-Language']);
    }
    const response = await api.get('page', requestParams);
    return response.json;
  } catch (e) {
    return e;
  }
};

const save = async (
  page: Page,
  headers?: IncomingHttpHeaders
): Promise<Page | FetchResponseError> => {
  try {
    const requestParams = new RequestParams(page, headers);
    const response = await api.post('pages', requestParams);
    return response.json;
  } catch (e) {
    return e;
  }
};

const deleteBySharedId = async (sharedId: string, headers?: IncomingHttpHeaders): Promise<Page> => {
  try {
    const response = await api.delete('pages', new RequestParams({ sharedId }, headers));
    return response.json;
  } catch (e) {
    return e;
  }
};

export { get, getBySharedId, deleteBySharedId, save };
