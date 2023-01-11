import { RequestParams } from 'app/utils/RequestParams';
import api from 'app/utils/api';
import { SuggestionsStats } from 'shared/types/suggestionStats';
import { IXTemplateConfiguration } from './PropertyConfigurationModal';
import { IXExtractorInfo } from './ExtractorCreationModal';

const getSuggestions = async (requestParams: RequestParams) => {
  const { json: response } = await api.get('suggestions', requestParams);
  return {
    suggestions: response.suggestions,
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
const saveConfigurations = async (requestParams: RequestParams<IXTemplateConfiguration[]>) => {
  const { json: response } = await api.post('suggestions/configurations', requestParams);
  return response;
};

const getAllExtractors = async (requestParams: RequestParams) => {
  const { json: response } = await api.get('ixextractors/all', requestParams);
  return response;
};

const createExtractor = async (requestParams: RequestParams<IXExtractorInfo>) => {
  const { json: response } = await api.post('ixextractors/create', requestParams);
  return response;
};

const deleteExtractors = async (requestParams: RequestParams<string[]>) => {
  const { json: response } = await api.post('ixextractors/delete', requestParams);
  return response;
};

export {
  getSuggestions,
  getStats,
  trainModel,
  cancelFindingSuggestions,
  ixStatus,
  acceptEntitySuggestion,
  saveConfigurations,
  getAllExtractors,
  createExtractor,
  deleteExtractors,
};
