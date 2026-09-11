import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { EntitySuggestionType, SuggestionCustomFilter } from '#shared/types/suggestionType.js';

/**
 * The nine status booleans the settings table filters by.
 *
 * Reuses the wire type rather than declaring a parallel domain copy of the same nine booleans:
 * it is already a plain DTO with no store vocabulary in it. What was store-specific was never
 * the type but the *translation* — `translateCustomFilter` and the `$or` fragments it builds,
 * which now live inside the mongo implementation instead of in the caller.
 *
 * The flags are a union: several set means "any of these", not "all of these".
 */
export type SuggestionStatusFilter = SuggestionCustomFilter;

export type SuggestionSort = {
  /** A stored field of the suggestion, not a projected name. */
  field?: string;
  order?: 'asc' | 'desc';
};

export type TableQuery = {
  extractorId: ObjectIdSchema;
  statusFilter?: SuggestionStatusFilter;
  sort?: SuggestionSort;
  page: { skip: number; limit: number };
};

/**
 * One row of the settings suggestions table: the shared wire type the front end already consumes,
 * plus the `useForTraining` flag the projection adds and the table renders.
 *
 * Its `entityId`, `fileId` and `extractorId` are declared as strings because that is what a
 * caller receives once the row has been serialised; mongo hands back `ObjectId`s that serialise
 * to exactly those strings, and stage 6 must produce the same shape.
 */
export type SuggestionTableRow = EntitySuggestionType & {
  /** Optional on the shared type; every stored row has one and the projection keeps it. */
  _id: ObjectIdSchema;
  useForTraining: boolean;
};

/**
 * Read side of the settings suggestions table.
 *
 * Holds only the store-specific work — match, sort, page, count, projection. The extractor and
 * property lookups and the `suggestedValue` defaulting stay in `GetSuggestionsForTableQuery`, so
 * a second implementation does not have to duplicate them and cannot drift from them.
 */
export interface IXSuggestionsTableQueryService {
  getForTable(query: TableQuery): Promise<{ rows: SuggestionTableRow[]; total: number }>;
}
