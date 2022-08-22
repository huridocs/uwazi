import { Settings } from 'shared/types/settingsType';
import { SearchParams } from 'shared/types/searchParams.d';

export const tocGenerationUtils = {
  aggregations(params: SearchParams, settings: Settings) {
    return {
      ...params,
      ...(settings?.features?.tocGeneration ? { aggregateGeneratedToc: true } : {}),
    };
  },
};
