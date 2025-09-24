import { ClientSettings } from '../../apiResponseTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/searchParam... Remove this comment to see the full error message
import { SearchParams } from 'shared/types/searchParameterType.js';

export const tocGenerationUtils = {
  aggregations(params: SearchParams, settings: ClientSettings) {
    return {
      ...params,
      ...(settings?.features?.tocGeneration ? { aggregateGeneratedToc: true } : {}),
    };
  },
};
