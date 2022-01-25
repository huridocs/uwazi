import { RequestParams } from 'app/utils/RequestParams';
import api from 'app/utils/api';

const getSuggestions = async (requestParams: RequestParams) => {
  const { json: response } = await api.get('suggestions', requestParams);
  return {
    suggestions: response.suggestions,
    totalPages: response.totalPages,
  };
};

const trainModel = async (requestParams: RequestParams) => {
  const { json: response } = await api.post('suggestions/train', requestParams);
  return response;
};

const ixStatus = async (requestParams: RequestParams) => {
  const { json: response } = await api.get('suggestions/status', requestParams);
  return response;
};

const acceptEntitySuggestion = async (requestParams: RequestParams) => {
  const { json: response } = await api.post('suggestions/accept', requestParams);
  return response;
};

export { getSuggestions, trainModel, ixStatus, acceptEntitySuggestion };
