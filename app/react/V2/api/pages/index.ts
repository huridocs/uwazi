import { IncomingHttpHeaders } from 'http';
import { api } from '#app/utils/api.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { Page } from '#V2/shared/types.js';
import { FetchResponseError } from '#shared/JSONRequest.js';

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

const getBySharedIdForEditor = async (
  sharedId: string,
  headers?: IncomingHttpHeaders
): Promise<Page> => {
  try {
    const requestParams = new RequestParams({ sharedId, mode: 'editor' }, headers);
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

const release = async (
  sharedId: string,
  releaseMessage: string,
  headers?: IncomingHttpHeaders
): Promise<Page | FetchResponseError> => {
  try {
    // eslint-disable-next-line camelcase
    const requestParams = new RequestParams({ sharedId, release_message: releaseMessage }, headers);
    const response = await api.post('pages/release', requestParams);
    return response.json;
  } catch (e) {
    return e;
  }
};

const restore = async (
  sharedId: string,
  version: number,
  headers?: IncomingHttpHeaders
): Promise<Page | FetchResponseError> => {
  try {
    const requestParams = new RequestParams({ sharedId, version }, headers);
    const response = await api.post('pages/restore', requestParams);
    return response.json;
  } catch (e) {
    return e;
  }
};

export { get, getBySharedId, getBySharedIdForEditor, deleteBySharedId, save, release, restore };
