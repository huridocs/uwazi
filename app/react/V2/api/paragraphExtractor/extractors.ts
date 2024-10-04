import { IncomingHttpHeaders } from 'http';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { IXExtractorInfo } from 'V2/shared/types';

let dummyData = [
  {
    _id: '1',
    templateFrom: ['66fbe4f28542cc5545e05a46', '66fbe4d28542cc5545e0599c'],
    templateTo: '5bfbb1a0471dd0fc16ada146',
    documents: 831,
    generatedEntities: 12000,
    rowId: '1',
    status: '',
  },
  {
    _id: '2',
    templateFrom: ['66fbe4d28542cc5545e0599c', 'Judge Documents'],
    templateTo: '66fbe4f28542cc5545e05a46',
    documents: 500,
    generatedEntities: 12001,
    rowId: '1',
    status: '',
  },
];

const apiEndpoint = 'paragraph-extractor';

const get = async () =>
  new Promise(resolve => {
    setTimeout(() => resolve(dummyData));
  });

const getById = async (extractorId: string, headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams({ id: extractorId }, headers);
    const { json: response } = await api.get(apiEndpoint, requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const save = async (extractor: IXExtractorInfo) => {
  const requestParams = new RequestParams(extractor);
  let response: IXExtractorInfo[];
  if (extractor._id) {
    response = await api.put(apiEndpoint, requestParams);
  } else {
    response = await api.post(apiEndpoint, requestParams);
  }
  return response;
};

const remove = async (ids: string[]) => {
  // const requestParams = new RequestParams({ ids });
  // const response = await api.delete(apiEndpoint, requestParams);
  // return response;
  dummyData = dummyData.filter(data => !ids.includes(data._id));
  console.log(dummyData);
  return true;
};

export { get, save, remove, getById };
