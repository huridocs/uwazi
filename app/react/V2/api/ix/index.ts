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

const save = async (extractor: IXExtractorInfo) => {
  const requestParams = new RequestParams(extractor);
  let response: IXExtractorInfo[];

  if (extractor._id) {
    response = await api.put('ixextractors', requestParams);
  } else {
    response = await api.post('ixextractors', requestParams);
  }

  return response;
};

const remove = async (ids: string[]) => {
  const requestParams = new RequestParams({ ids });
  const response = await api.delete('ixextractors', requestParams);
  return response;
};

export { get, save, remove };
