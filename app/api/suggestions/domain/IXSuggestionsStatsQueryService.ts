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

/**
 * Read side of the stats bar. A query service rather than a method on
 * `IXSuggestionsDataSource`: it is a read-only projection with no counterpart write, so it
 * follows the CQRS split the core already uses (see `PXEntityStatusesQueryService`).
 */
export interface IXSuggestionsStatsQueryService {
  getStatsForExtractor(extractorId: ObjectIdSchema): Promise<SuggestionStats>;
}
