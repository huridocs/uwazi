import { RequestParams } from 'app/utils/RequestParams';
import { SuggestionsSampleData } from 'app/MetadataExtraction/SuggestionsSampleData';

const getSuggestions = async (requestParams: RequestParams) =>
  new Promise(resolve => {
    const data = SuggestionsSampleData(requestParams.data.page);
    resolve({
      suggestions: data,
      totalPages: 100,
    });
  });

export { getSuggestions };
