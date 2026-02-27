import { ClientSettings } from '#app/apiResponseTypes.js';
import { SearchParams } from '#shared/types/searchParameterType.js';

export const tocGenerationUtils = {
  aggregations(params: SearchParams, settings: ClientSettings) {
    return {
      ...params,
      ...(settings?.features?.tocGeneration ? { aggregateGeneratedToc: true } : {}),
    };
  },
};
