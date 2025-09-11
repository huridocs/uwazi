/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface IXModelType {
  _id?: ObjectIdSchema;
  extractorId: ObjectIdSchema;
  creationDate: number;
  status?: 'processing' | 'failed' | 'ready';
  findingSuggestions?: boolean;
  processRun?: {
    suggestionsRunTimestamp?: number;
    mode?: string;
    find?: {
      enabled?: boolean;
      size?: number;
      filters?: {
        nonProcessed?: boolean;
        obsolete?: boolean;
        error?: boolean;
        [k: string]: unknown | undefined;
      };
      selectedSharedIds?: string[];
      [k: string]: unknown | undefined;
    };
    autoAccept?: {
      enabled?: boolean;
      source?: string;
      overwriteMode?: string;
      [k: string]: unknown | undefined;
    };
    autoAcceptProgress?: {
      total?: number;
      processed?: number;
      [k: string]: unknown | undefined;
    };
    findSuggestionsSharedIds?: string[];
    findSuggestionsInitialSharedIdsCount?: number;
    selectedSharedIdsForAutoAccept?: string[];
  };
  maxSuggestionsToFind?: number;
  totalSuggestionsToFind?: number;
}
