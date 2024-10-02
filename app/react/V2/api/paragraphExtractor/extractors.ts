import { IncomingHttpHeaders } from 'http';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { IXExtractorInfo } from 'V2/shared/types';

const get = async (headers?: IncomingHttpHeaders) =>
  new Promise(resolve => {
    setTimeout(() =>
      resolve([
        {
          _id: '1',
          templateFrom: ['Court of Documents1', 'Judge Documents'],
          templateTo: '5bfbb1a0471dd0fc16ada146',
          documents: 831,
          generatedEntities: 12000,
          rowId: '1',
          status: '',
        },
      ])
    );
  });

const getById = async (extractorId: string, headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams({ id: extractorId }, headers);
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

export { get, save, remove, getById };
