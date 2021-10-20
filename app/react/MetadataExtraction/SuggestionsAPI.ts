import { RequestParams } from 'app/utils/RequestParams';
import { SuggestionsSampleData } from './SuggestionsSampleData';

const getSuggestions = async (requestParams: RequestParams) =>
  // temporal sample data, should be replaced by real API call
  new Promise(resolve => {
    const data = SuggestionsSampleData(requestParams.data);
    resolve({
      suggestions: data,
      totalPages: 30,
    });
  });

export { getSuggestions };
