import { IncomingHttpHeaders } from 'http';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';

const get = async (headers?: IncomingHttpHeaders) => {
  const requestParams = new RequestParams({}, headers);
  const { json: response } = await api.get('ixextractors', requestParams);
  return response;
};

// const getSuggestions = async (requestParams: RequestParams) => {
//   const { json: response } = await api.get('suggestions', requestParams);
//   return {
//     suggestions: response.suggestions,
//     aggregations: response.aggregations,
//     totalPages: response.totalPages,
//   };
// };

// const getStats = async (requestParams: RequestParams): Promise<SuggestionsStats> => {
//   const { json: response } = await api.get('suggestions/stats', requestParams);
//   return response;
// };

// const trainModel = async (requestParams: RequestParams) => {
//   const { json: response } = await api.post('suggestions/train', requestParams);
//   return response;
// };

// const cancelFindingSuggestions = async (requestParams: RequestParams) => {
//   const { json: response } = await api.post('suggestions/stop', requestParams);
//   return response;
// };

// const ixStatus = async (requestParams: RequestParams) => {
//   const { json: response } = await api.post('suggestions/status', requestParams);
//   return response;
// };

// const acceptEntitySuggestion = async (requestParams: RequestParams) => {
//   const { json: response } = await api.post('suggestions/accept', requestParams);
//   return response;
// };

// const createExtractor = async (requestParams: RequestParams<IXExtractorInfo>) => {
//   const { json: response } = await api.post('ixextractors', requestParams);
//   return response;
// };

const deleteExtractors = async (ids: string[]) => {
  const requestParams = new RequestParams({ ids });
  const response = await api.delete('ixextractors', requestParams);
  return response;
};

// const updateExtractor = async (requestParams: RequestParams<IXExtractorInfo>) => {
//   const { json: response } = await api.put('ixextractors', requestParams);
//   return response;
// };

export { get, deleteExtractors };
