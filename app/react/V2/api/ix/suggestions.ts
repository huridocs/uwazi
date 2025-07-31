import { IncomingHttpHeaders } from 'http';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { IXSuggestionsQuery } from 'shared/types/suggestionType';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { SuggestionValue } from 'app/V2/Routes/Settings/IX/types';

const get = async (
  parameters: {
    page: { number: number; size: number };
    filter: {
      extractorId: string;
      states?: string[];
      entityTemplates?: string[];
      customFilter?: any;
    };
    sort?: IXSuggestionsQuery['sort'];
  },
  headers?: IncomingHttpHeaders
) => {
  const params = new RequestParams(parameters, headers);
  const response = await api.get('suggestions', params);
  return response.json;
};

const aggregation = async (extractorId: string, headers?: IncomingHttpHeaders) => {
  const params = new RequestParams({ extractorId }, headers);
  const response = await api.get('suggestions/aggregation', params);
  return response.json;
};

const accept = async (
  suggestions: {
    _id: ObjectIdSchema;
    sharedId: string;
    entityId: ObjectIdSchema;
    addedValues: SuggestionValue[] | undefined;
    removedValues: SuggestionValue[] | undefined;
  }[]
) => {
  const params = new RequestParams({ suggestions });
  const response = await api.post('suggestions/accept', params);
  return response.json;
};

const findSuggestions = async (extractorId: string, headers?: IncomingHttpHeaders) => {
  const params = new RequestParams({ extractorId }, headers);
  const response = await api.post('suggestions/train', params);
  return response.json;
};

const findSelectedSuggestions = async (extractorId: string, sharedIds: string[]) => {
  const params = new RequestParams({ extractorId, sharedIds });
  const response = await api.post('suggestions/find', params);
  return response.json;
};

const status = async (extractorId: string, headers?: IncomingHttpHeaders) => {
  const params = new RequestParams({ extractorId }, headers);
  const { json: response } = await api.post('suggestions/status', params);
  return response;
};

const cancel = async (extractorId: string, headers?: IncomingHttpHeaders) => {
  const params = new RequestParams({ extractorId }, headers);
  const { json: response } = await api.post('suggestions/stop', params);
  return response;
};

const testRun = async (extractorId: string, headers?: IncomingHttpHeaders): Promise<number> => {
  try {
    const params = new RequestParams({ extractorId }, headers);
    const { status: response } = await api.post('suggestions/test_model', params);
    return response;
  } catch (e) {
    return e;
  }
};

export {
  get,
  accept,
  aggregation,
  findSuggestions,
  status,
  cancel,
  testRun,
  findSelectedSuggestions,
};
