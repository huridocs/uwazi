import { ObjectId } from 'mongodb';
import { IXSuggestionType } from '#shared/types/suggestionType.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';

/**
 * `_id` is narrowed to `ObjectId`, mirroring what the mongoose model returns
 * (`EnforcedWithId`), because consumers rely on it. Declared here rather than imported from the
 * odm so this port does not depend on the layer it replaces.
 */
export type Suggestion = IXSuggestionType & { _id: ObjectId };

/**
 * How a set of suggestions is scoped to a process run.
 *
 * Stage 2 §1 proposed one `RunScope` value object covering four inline scope-builders. Reading
 * all four showed they ask four different questions; only auto-acceptance and the status count
 * share "belongs to run T", and only the former needs a union. So this covers acceptance, the
 * status counts are their own named operations, and sampling/pending-ids take plain arguments.
 * See plans/information-extraction-rewrite/stage-4c-suggestions-dao.md.
 */
export type RunScope =
  | { kind: 'all' }
  | { kind: 'entities'; entityIds: string[] }
  | { kind: 'run'; runTimestamp: number };

/** The suggestions auto-acceptance may take: ready, suggested, not obsolete, not errored. */
export type AcceptanceQuery = {
  extractorId: ObjectIdSchema;
  scope: RunScope;
  /** `overwrite_all`: when false, only suggestions whose entity has no value yet. */
  includeAlreadyValued: boolean;
};

/** The three non-ready statuses a process run can be asked to work through. */
export type PendingStatusFilter = {
  nonProcessed?: boolean;
  obsolete?: boolean;
  error?: boolean;
};

export type EntityLanguagePair = { sharedId: string; language: string };

export type TrainingMarkedSuggestion = {
  entityId?: string;
  language?: string;
  /** `ObjectIdSchema`, not `ObjectId`: `IXSuggestionType` stores it loosely and callers narrow. */
  fileId?: ObjectIdSchema;
};

/**
 * Persistence port for `ixsuggestions`.
 *
 * Every method is a named operation. No mongo query object, `$`-operator, dotted path or
 * aggregation pipeline may appear in a parameter or a return type.
 *
 * **Scope note (stage 4c-1):** this port deliberately covers only the *non-aggregation* surface.
 * The read-only aggregations — the table query, the stats bar, the state-recompute cursor and the
 * `$facet` sampling — become **query services** in 4c-2, not methods here. That is why there is
 * no `getSuggestionsForTable` and no `aggregate`.
 */
export interface IXSuggestionsDataSource {
  /* ------------------------------------------------------------------------- reads -- */

  getByIds(ids: ObjectIdSchema[]): Promise<Suggestion[]>;

  /** Of `ids`, those actually belonging to this extractor. Used to reject foreign ids. */
  getIdsOwnedByExtractor(extractorId: ObjectIdSchema, ids: ObjectIdSchema[]): Promise<ObjectId[]>;

  getOneForEntity(query: {
    extractorId: ObjectIdSchema;
    entityId: string;
    language: string;
  }): Promise<Suggestion | undefined>;

  getOneForFile(query: {
    extractorId: ObjectIdSchema;
    entityId: string;
    fileId: ObjectIdSchema;
  }): Promise<Suggestion | undefined>;

  getByFileIds(extractorId: ObjectIdSchema, fileIds: ObjectIdSchema[]): Promise<Suggestion[]>;

  getByEntityLanguagePairs(
    extractorId: ObjectIdSchema,
    pairs: EntityLanguagePair[]
  ): Promise<Suggestion[]>;

  /** Suggestions flagged `useForTraining`, with just the fields the training material needs. */
  getTrainingMarked(extractorId: ObjectIdSchema): Promise<TrainingMarkedSuggestion[]>;

  isMarkedForTraining(
    extractorId: ObjectIdSchema,
    entityId: string,
    language: string
  ): Promise<boolean>;

  getAcceptable(
    query: AcceptanceQuery,
    page: { limit: number; skip?: number }
  ): Promise<Suggestion[]>;

  /* ------------------------------------------------------------------------ counts -- */

  /** Every suggestion of the extractor. The training path's progress denominator. */
  countAllForExtractor(extractorId: ObjectIdSchema): Promise<number>;

  /**
   * Suggestions in the three non-ready statuses. The process path's progress denominator.
   * An empty filter means all three — the two rules are kept distinct on purpose; see
   * stage-1 finding 3 in the stage-4c plan.
   */
  countPendingForExtractor(
    extractorId: ObjectIdSchema,
    filter?: PendingStatusFilter
  ): Promise<number>;

  /** Completed in this run: ready, dated, not obsolete, not errored, tagged with the run. */
  countProcessedInRun(extractorId: ObjectIdSchema, runTimestamp: number): Promise<number>;

  /** Completed since a point in time — the fallback when a run carries no timestamp. */
  countProcessedSince(extractorId: ObjectIdSchema, since: number): Promise<number>;

  countAcceptable(query: AcceptanceQuery): Promise<number>;

  /* ------------------------------------------------------------------ entity-id sets -- */

  /** Of `candidateIds`, those already queued or already answered in this run. */
  getEntityIdsSeenInRun(
    extractorId: ObjectIdSchema,
    candidateIds: string[],
    runTimestamp: number
  ): Promise<string[]>;

  /** Of `entityIds`, those with at least one dated, non-obsolete, non-errored suggestion. */
  getEntityIdsWithHealthySuggestions(
    extractorId: ObjectIdSchema,
    entityIds: string[]
  ): Promise<string[]>;

  /** Of `entityIds`, those with at least one dated, obsolete suggestion. */
  getEntityIdsWithObsoleteSuggestions(
    extractorId: ObjectIdSchema,
    entityIds: string[]
  ): Promise<string[]>;

  /* ------------------------------------------------------------------------ writes -- */

  /** Upsert by `_id`, merging into existing rows and inserting the rest. */
  saveMultiple(suggestions: Partial<IXSuggestionType>[]): Promise<Suggestion[]>;

  /** Insert only. Blank-suggestion creation, which knows the rows are new. */
  createMultiple(suggestions: Partial<IXSuggestionType>[]): Promise<void>;

  markObsoleteForExtractor(extractorId: ObjectIdSchema): Promise<void>;

  /** Fail whatever is still `processing` for this extractor, with the run's error message. */
  markProcessingAsFailed(extractorId: ObjectIdSchema, errorMessage: string): Promise<void>;

  setUseForTraining(ids: ObjectIdSchema[], useForTraining: boolean): Promise<void>;

  clearTrainingSamplesForExtractor(extractorId: ObjectIdSchema): Promise<void>;
  markTrainingSamples(extractorId: ObjectIdSchema, entityIds: string[]): Promise<void>;

  /* ----------------------------------------------------------------------- deletes -- */

  deleteByExtractorId(extractorId: ObjectIdSchema): Promise<void>;
  deleteByExtractorIds(extractorIds: ObjectIdSchema[]): Promise<void>;

  /** Suggestions for any of these templates within any of these extractors. */
  deleteByTemplatesAndExtractors(
    templateIds: string[],
    extractorIds: ObjectIdSchema[]
  ): Promise<void>;

  deleteByFileIds(fileIds: ObjectIdSchema[]): Promise<void>;
  deleteByEntityId(sharedId: string): Promise<void>;
  deleteByEntityAndTemplate(sharedId: string, templateId: string): Promise<void>;
}
