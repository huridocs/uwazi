import { IncomingHttpHeaders } from 'http';
// @ts-expect-error TS(2307): Cannot find module '../../utils/api.js' or its cor... Remove this comment to see the full error message
import api from '../../utils/api.js';
// @ts-expect-error TS(2307): Cannot find module '../../utils/RequestParams.js' ... Remove this comment to see the full error message
import { RequestParams } from '../../utils/RequestParams.js';
import { ClientIXExtractorType } from 'shared/types.js';

const get = async (headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams({}, headers);
    const { json: response } = await api.get('ixextractors', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const save = async (extractor: ClientIXExtractorType) => {
  const requestParams = new RequestParams(extractor);
  let response: ClientIXExtractorType[];

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
