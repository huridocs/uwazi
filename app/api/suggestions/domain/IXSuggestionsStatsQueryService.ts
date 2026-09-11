import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { IXSuggestionAggregation } from '#shared/types/suggestionType.js';

/**
 * What `GET /api/suggestions/aggregation` returns.
 *
 * `IXSuggestionAggregation` does not declare `accuracy`, but the value has always been computed
 * and the settings sidepanel renders it (`FiltersSidepanel.tsx`). Declared here rather than
 * widening the shared type, which is also the route's response type.
 */
export type SuggestionStats = IXSuggestionAggregation & { accuracy: number };

/** The stats of an extractor with no suggestions. Unlike any other result, it has no `useForTraining`. */
export const emptyStats: SuggestionStats = {
  total: 0,
  labeled: 0,
  nonLabeled: 0,
  match: 0,
  mismatch: 0,
  obsolete: 0,
  error: 0,
  noContext: 0,
  nonProcessed: 0,
  accuracy: 0,
};

/**
 * Read side of the stats bar. A query service rather than a method on
 * `IXSuggestionsDataSource`: it is a read-only projection with no counterpart write, so it
 * follows the CQRS split the core already uses (see `PXEntityStatusesQueryService`).
 */
export interface IXSuggestionsStatsQueryService {
  getStatsForExtractor(extractorId: ObjectIdSchema): Promise<SuggestionStats>;
}
