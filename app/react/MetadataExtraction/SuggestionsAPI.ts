import { RequestParams } from 'app/utils/RequestParams';
import api from 'app/utils/api';
import { SuggestionsStats } from 'shared/types/suggestionStats';
import { IXExtractorInfo } from 'V2/shared/types';

const getSuggestions = async (requestParams: RequestParams) => {
  const { json: response } = await api.get('suggestions', requestParams);
  return {
    suggestions: response.suggestions,
    aggregations: response.aggregations,
    totalPages: response.totalPages,
  };
};

const getStats = async (requestParams: RequestParams): Promise<SuggestionsStats> => {
  const { json: response } = await api.get('suggestions/stats', requestParams);
  return response;
};

const trainModel = async (requestParams: RequestParams) => {
  const { json: response } = await api.post('suggestions/train', requestParams);
  return response;
};

const cancelFindingSuggestions = async (requestParams: RequestParams) => {
  const { json: response } = await api.post('suggestions/stop', requestParams);
  return response;
};

const ixStatus = async (requestParams: RequestParams) => {
  const { json: response } = await api.post('suggestions/status', requestParams);
  return response;
};

const acceptEntitySuggestion = async (requestParams: RequestParams) => {
  const { json: response } = await api.post('suggestions/accept', requestParams);
  return response;
};

const getAllExtractors = async (requestParams: RequestParams) => {
  const { json: response } = await api.get('ixextractors', requestParams);
  return response;
};

const createExtractor = async (requestParams: RequestParams<IXExtractorInfo>) => {
  const { json: response } = await api.post('ixextractors', requestParams);
  return response;
};

const deleteExtractors = async (requestParams: RequestParams<{ ids: string[] }>) => {
  const { json: response } = await api.delete('ixextractors', requestParams);
  return response;
};

const updateExtractor = async (requestParams: RequestParams<IXExtractorInfo>) => {
  const { json: response } = await api.put('ixextractors', requestParams);
  return response;
};

export {
  getSuggestions,
  getStats,
  trainModel,
  cancelFindingSuggestions,
  ixStatus,
  acceptEntitySuggestion,
  getAllExtractors,
  createExtractor,
  deleteExtractors,
  updateExtractor,
};
