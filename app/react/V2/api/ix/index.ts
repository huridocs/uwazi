import { IncomingHttpHeaders } from 'http';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { IXExtractorInfo } from 'V2/shared/types';
import { ObjectIdSchema } from 'shared/types/commonTypes';

const getExtractors = async (headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams({}, headers);
    const { json: response } = await api.get('ixextractors', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const getExtractorById = async (extractorId: string, headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams({ id: extractorId }, headers);
    const { json: response } = await api.get('ixextractors', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const saveExtractors = async (extractor: IXExtractorInfo) => {
  const requestParams = new RequestParams(extractor);
  let response: IXExtractorInfo[];

  if (extractor._id) {
    response = await api.put('ixextractors', requestParams);
  } else {
    response = await api.post('ixextractors', requestParams);
  }

  return response;
};

const removeExtractors = async (ids: string[]) => {
  const requestParams = new RequestParams({ ids });
  const response = await api.delete('ixextractors', requestParams);
  return response;
};

const getSuggestions = async (
  parameters: {
    page: { number: number; size: number };
    filter: {
      extractorId?: string;
      states?: string[];
      entityTemplates?: string[];
    };
  },
  headers?: IncomingHttpHeaders
) => {
  const params = new RequestParams(parameters, headers);
  const response = await api.get('suggestions', params);
  return response.json;
};

const acceptSuggestion = async (
  suggestion: { _id: ObjectIdSchema; sharedId: string; entityId: string },
  allLanguages: boolean = true
) => {
  const params = new RequestParams({ suggestion, allLanguages });
  const response = await api.post('suggestions/accept', params);
  return response.json;
};

export {
  getExtractors,
  saveExtractors,
  removeExtractors,
  getSuggestions,
  getExtractorById,
  acceptSuggestion,
};
