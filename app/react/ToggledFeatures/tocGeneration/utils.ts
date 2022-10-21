import { ClientSettings } from 'app/apiResponseTypes';
import { SearchParams } from 'shared/types/searchParams.d';

export const tocGenerationUtils = {
  aggregations(params: SearchParams, settings: ClientSettings) {
    return {
      ...params,
      ...(settings?.features?.tocGeneration ? { aggregateGeneratedToc: true } : {}),
    };
  },
};
