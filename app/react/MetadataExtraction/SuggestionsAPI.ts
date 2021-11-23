import { RequestParams } from 'app/utils/RequestParams';
import api from 'app/utils/api';

const getSuggestions = async (requestParams: RequestParams) => {
  const { json: response } = await api.get('suggestions', requestParams);
  return {
    suggestions: response.suggestions,
    totalPages: response.totalPages,
  };
};

export { getSuggestions };
