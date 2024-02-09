import { IncomingHttpHeaders } from 'http';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { Page } from 'V2/shared/types';
import { FetchResponseError } from 'shared/JSONRequest';

const get = async (language: string, headers?: IncomingHttpHeaders): Promise<Page> => {
  try {
    const requestParams = new RequestParams({}, headers);
    api.locale(language);
    const response = await api.get('pages', requestParams);
    return response.json;
  } catch (e) {
    return e;
  }
};

const getBySharedId = async (
  sharedId: string,
  language: string,
  headers?: IncomingHttpHeaders
): Promise<Page> => {
  try {
    const requestParams = new RequestParams({ sharedId }, headers);
    api.locale(language);
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
