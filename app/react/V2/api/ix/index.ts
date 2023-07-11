import { IncomingHttpHeaders } from 'http';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { IXExtractorInfo } from 'V2/shared/types';

const get = async (headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams({}, headers);
    const { json: response } = await api.get('ixextractors', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const remove = async (ids: string[]) => {
  const requestParams = new RequestParams({ ids });
  const response = await api.delete('ixextractors', requestParams);
  return response;
};

const save = async (extractor: IXExtractorInfo) => {
  const requestParams = new RequestParams(extractor);
  const response = await api.post('ixextractors', requestParams);
  return response;
};

const update = async (extractor: IXExtractorInfo) => {
  const requestParams = new RequestParams(extractor);
  const response = await api.put('ixextractors', requestParams);
  return response;
};

export { get, save, update, remove };
