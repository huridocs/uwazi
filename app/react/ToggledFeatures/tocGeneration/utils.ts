import { ClientSettings } from '../../apiResponseTypes.js';
import { SearchParams } from 'shared/types/searchParameterType';

export const tocGenerationUtils = {
  aggregations(params: SearchParams, settings: ClientSettings) {
    return {
      ...params,
      ...(settings?.features?.tocGeneration ? { aggregateGeneratedToc: true } : {}),
    };
  },
};
