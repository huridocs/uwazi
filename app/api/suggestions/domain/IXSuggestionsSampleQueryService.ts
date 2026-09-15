import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { PendingStatusFilter, Suggestion } from './IXSuggestionsDataSource.js';

export type SampleQuery = {
  extractorId: ObjectIdSchema;
  /** Which of the three non-ready statuses to draw from. Empty means all three. */
  statusFilter?: PendingStatusFilter;
  /** How many of each half to take — decided by `balancedSampleSizes`, not by the store. */
  sizes: { labeled: number; unlabeled: number };
};

/**
 * Picks a process run's next batch.
 *
 * A query service rather than a data source method because the selection is random and
 * store-specific (`$sample` here, `ORDER BY random()` elsewhere), while the sizes it is given are
 * decided in the domain. Splitting it that way is what stops the two stores from growing two
 * different notions of a balanced batch.
 */
export interface IXSuggestionsSampleQueryService {
  sampleForProcess(query: SampleQuery): Promise<Suggestion[]>;
}
