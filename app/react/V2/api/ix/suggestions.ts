import { IncomingHttpHeaders } from 'http';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { IXSuggestionsQuery } from 'shared/types/suggestionType';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { SuggestionValue } from 'V2/Routes/Settings/IX/types';

type ProcessParameters = {
  extractorId: string;
  mode: 'process_extractor' | 'process_selected';
  find?: {
    enabled?: boolean;
    size?: number;
    filters?: {
      error?: boolean;
      obsolete?: boolean;
      nonProcessed?: boolean;
    };
    selectedSharedIds?: string[];
  };
  autoAccept?: {
    enabled?: boolean;
    source?: 'previous' | 'all';
    overwriteMode?: 'blank_only' | 'overwrite_all';
  };
};

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

const findSuggestions = async (
  { extractorId, suggestionsToFind = 0 }: { extractorId: string; suggestionsToFind: number },
  headers?: IncomingHttpHeaders
) => {
  const params = new RequestParams({ extractorId, suggestionsToFind }, headers);
  const response = await api.post('suggestions/train', params);
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

const process = async (
  parameters: ProcessParameters,
  headers?: IncomingHttpHeaders
): Promise<{ status: string; message: string; data?: { total?: number } }> => {
  const params = new RequestParams(parameters, headers);
  const { json: response } = await api.post('suggestions/process', params);
  return response;
};

export type { ProcessParameters };
export { get, accept, aggregation, findSuggestions, status, cancel, process };
