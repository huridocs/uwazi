import { ObjectId } from 'mongodb';
import { IXModelType } from '#shared/types/IXModelType.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';

/**
 * `_id` is narrowed to `ObjectId`, mirroring what the retired mongoose model returned
 * (`EnforcedWithId`), because consumers rely on it — `ixMaterials` and
 * `FetchMaterialsForTraining` both type their parameter as `EnforcedWithId<IXModelType>`.
 * Declared here rather than imported from the odm so this port does not depend on the layer
 * it replaces. Whether stage 6 keeps ObjectIds or normalises to strings is a stage-5 schema
 * decision.
 */
export type IXModel = IXModelType & { _id: ObjectId };

/**
 * Persistence port for `ixmodels` — one row per extractor.
 *
 * Every method is a named operation. No mongo query object, `$`-operator, dotted path or
 * aggregation pipeline may appear in a parameter or a return type: a pipeline crossing this
 * interface is what would make the Postgres implementation (stage 6) impossible.
 *
 * Derived from the real call sites rather than designed up front; see
 * plans/information-extraction-rewrite/stage-2-dao-surface.md §3.
 *
 * Note on `processRun`: it is a ten-field optional bag mutated through `$set` / `$unset` /
 * `$inc` / pipeline updates. Every one of those mutations is named below, so stage 5 has a
 * single place from which to decide whether it is durable state or per-run scratch.
 */
export interface IXModelsDataSource {
  getByExtractorId(extractorId: ObjectIdSchema): Promise<IXModel | undefined>;

  /** Only `InformationExtraction.updateSuggestionStatus` looks a model up by its own id. */
  getById(id: ObjectIdSchema): Promise<IXModel | undefined>;

  /**
   * Upsert by `_id`, **merging** the given fields into any existing row rather than replacing
   * it, and inserting when there is none. This mirrors the retired odm `save` exactly
   * (`$set` + create-if-absent); callers pass whole spread-and-modified models and rely on
   * both halves of that behaviour.
   */
  save(model: Partial<IXModelType>): Promise<IXModel>;

  /* ------------------------------------------------------------- status transitions -- */

  /**
   * Begin a training run: mark the model processing and discard any previous `processRun`,
   * in one atomic write. Upserts, because the very first training of an extractor is what
   * creates its model row.
   */
  markTraining(
    extractorId: ObjectIdSchema,
    options: { maxSuggestionsToFind: number }
  ): Promise<void>;

  /** Flip an existing model into the finding-suggestions phase. Undefined when none exists. */
  markFindingSuggestions(extractorId: ObjectIdSchema): Promise<IXModel | undefined>;

  /**
   * End the run: clear `findingSuggestions`, mark the model ready and drop the run queue, in
   * one atomic write. Replaces the raw `findOneAndUpdate` in `InformationExtraction.stopModel`
   * and the read-then-write in `ixmodels.stopTraining` — which differed only in how they
   * reported a missing model, never in the state they left behind.
   *
   * Returns the updated model, or undefined when no model exists for this extractor; both
   * callers branch on that.
   */
  markReady(extractorId: ObjectIdSchema): Promise<IXModel | undefined>;

  /* -------------------------------------------------------------------- process run -- */

  setProcessRun(extractorId: ObjectIdSchema, processRun: IXModelType['processRun']): Promise<void>;
  clearProcessRun(extractorId: ObjectIdSchema): Promise<void>;

  /** Drop the three per-run queue fields, leaving the rest of `processRun` intact. */
  clearFindRunQueue(modelId: ObjectIdSchema): Promise<void>;

  initializeFindRunQueue(
    modelId: ObjectIdSchema,
    run: { pendingIds: string[]; selectedSharedIds: string[]; runTimestamp: number }
  ): Promise<void>;

  /** Union `sharedIds` into the queue, growing the initial count by however many are new. */
  appendToFindRunQueue(modelId: ObjectIdSchema, sharedIds: string[]): Promise<void>;

  /**
   * Remove up to `batchSize` ids from the front of the queue and return them — one atomic
   * take, not the read-slice-write the two `ixMaterials` callers used to do against a model
   * they already held in memory.
   */
  takeFromFindRunQueue(modelId: ObjectIdSchema, batchSize: number): Promise<string[]>;

  setAutoAcceptProgress(
    extractorId: ObjectIdSchema,
    progress: { total?: number; processed?: number }
  ): Promise<void>;

  incrementAutoAcceptProcessed(extractorId: ObjectIdSchema, by: number): Promise<void>;

  /**
   * Written only by the test seam (`specs/ixTestAccess.ts`), which needs to put a model into a
   * sample-policy state that no production code sets on its own. Unlike 4a's `getByName` there
   * is no read-and-filter trick available for a write, so it lives on the port.
   */
  setSamplePolicy(
    extractorId: ObjectIdSchema,
    samplePolicy: 'only_marked' | 'marked_plus_labeled'
  ): Promise<void>;
}
