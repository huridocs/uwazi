import { IncomingHttpHeaders } from 'http';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { ObjectIdSchema } from 'shared/types/commonTypes';

const get = async (
  parameters: {
    page: { number: number; size: number };
    filter: {
      extractorId: string;
      states?: string[];
      entityTemplates?: string[];
      customFilter?: any;
    };
  },
  headers?: IncomingHttpHeaders
) => {
  const params = new RequestParams(parameters, headers);
  const response = await api.get('suggestions', params);
  return response.json;
};

const aggregation = async (
  parameters: {
    filter: {
      extractorId: string;
      language?: string;
      entityTemplates?: string[];
    };
  },
  headers?: IncomingHttpHeaders
) => {
  const params = new RequestParams(parameters, headers);
  const response = await api.get('suggestions/aggregation', params);
  return response.json;
};

const accept = async (
  suggestion: { _id: ObjectIdSchema; sharedId: string; entityId: string },
  allLanguages: boolean = false
) => {
  const params = new RequestParams({ suggestion, allLanguages });
  const response = await api.post('suggestions/accept', params);
  return response.json;
};

export { get, accept, aggregation };
