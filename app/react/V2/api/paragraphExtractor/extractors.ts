import { IncomingHttpHeaders } from 'http';
// import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import {
  ParagraphExtractorApiResponse,
  ParagraphExtractorApiPayload,
} from 'app/V2/Routes/Settings/ParagraphExtraction/types';

let dummyData = [
  {
    _id: '1',
    templatesFrom: ['66fbe4f28542cc5545e05a46', '66fbe4d28542cc5545e0599c'],
    templateTo: '66ffac5860f7ab062d87d13e',
    documents: 831,
    generatedEntities: 12000,
  },
  {
    _id: '2',
    templatesFrom: ['66fbe4d28542cc5545e0599c', 'Judge Documents'],
    templateTo: '66ffac5860f7ab062d87d13e',
    documents: 500,
    generatedEntities: 12001,
  },
] as ParagraphExtractorApiResponse[];

// const apiEndpoint = 'paragraph-extractor';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const get = async (headers?: IncomingHttpHeaders) =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve(dummyData);
    });
  });

const getById = async (extractorId: string, headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams({ id: extractorId }, headers);
    // const { json: response } = await api.get(apiEndpoint, requestParams);
    const id = requestParams.data?.id;
    return dummyData.find(datum => datum._id === id);
    // return response;
  } catch (e) {
    return e;
  }
};

const save = async (
  extractorValues: ParagraphExtractorApiPayload
): Promise<ParagraphExtractorApiResponse> => {
  // const requestParams = new RequestParams(extractorValues);

  const dummyEntry = {
    ...extractorValues,
    documents: Math.floor(Math.random() * 1000),
    generatedEntities: Math.floor(Math.random() * 1000),
    _id: extractorValues?._id ?? Math.floor(Math.random() * 100).toString(),
  };

  dummyData.push(dummyEntry);
  console.log(dummyData);

  return new Promise(resolve => {
    resolve(dummyEntry);
  });
};

const remove = async (ids: string[]) => {
  // const requestParams = new RequestParams({ ids });
  // const response = await api.delete(apiEndpoint, requestParams);
  // return response;
  dummyData = dummyData.filter(data => !ids.includes(data._id ?? ''));
  console.log(dummyData);
  return true;
};

export { get, save, remove, getById };
