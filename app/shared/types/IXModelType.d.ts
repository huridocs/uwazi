/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface IXModelType {
  _id?: ObjectIdSchema;
  extractorId: ObjectIdSchema;
  creationDate: number;
  status?: 'processing' | 'failed' | 'ready';
  findingSuggestions?: boolean;
  findSuggestionsRunTimestamp?: number;
  findSuggestionsSharedIds?: string[];
  findSuggestionsInitialSharedIdsCount?: number;
  testRun?: boolean;
  testRunSuggestionsToFind?: number;
  totalSuggestionsToFind?: number;
}
