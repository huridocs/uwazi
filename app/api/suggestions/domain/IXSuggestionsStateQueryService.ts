import { ObjectId } from 'mongodb';
import { LanguagesListSchema, ObjectIdSchema } from '#shared/types/commonTypes.js';
import { CurrentValue, SuggestionValues } from '#shared/getIXSuggestionState.js';

/** Which suggestions a recompute walks. */
export type StateRecomputeScope = { kind: 'all' } | { kind: 'ids'; ids: ObjectIdSchema[] };

export type StateRecomputeQuery = {
  scope: StateRecomputeScope;
  /** The instance's configured languages; decides which entity a suggestion is paired with. */
  languages: LanguagesListSchema;
};

/**
 * A suggestion paired with the entity value it should be judged against.
 *
 * `currentValue` is always an array here — the store extracts it from the entity, and collapsing
 * it to a scalar for single-valued properties is the domain's job, not the store's.
 */
export type StateRecomputeRow = Omit<SuggestionValues, 'currentValue'> & {
  _id: ObjectId;
  propertyName: string;
  extractorId: ObjectIdSchema;
  currentValue: CurrentValue[];
};

/**
 * Read half of the suggestion state recompute.
 *
 * Streams rather than returning an array: a recompute can walk every suggestion of an instance,
 * which is why the mongo implementation hands back a cursor. Any store can satisfy an
 * `AsyncIterable`.
 *
 * The pairing itself has to stay one operation each store answers natively — it selects the
 * entity by language and digs the property's value out of its metadata, which is a rewrite in
 * SQL but not an impossibility. Fetching entities separately and assembling in the domain would
 * mean a second round trip per row.
 */
export interface IXSuggestionsStateQueryService {
  streamForStateRecompute(query: StateRecomputeQuery): AsyncIterable<StateRecomputeRow>;
}
