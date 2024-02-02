import { IncomingHttpHeaders } from 'http';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { Page } from 'V2/shared/types';

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

const get = async (headers?: IncomingHttpHeaders): Promise<Page> => {
  try {
    const response = await api.get('pages', new RequestParams({}, headers));
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

export { get, getBySharedId, deleteBySharedId };
