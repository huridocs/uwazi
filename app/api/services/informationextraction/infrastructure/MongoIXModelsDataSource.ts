import { Db, ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { IXModelType } from '#shared/types/IXModelType.js';
import { ModelStatus } from '#shared/types/IXModelSchema.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { IXModel, IXModelsDataSource } from '../domain/IXModelsDataSource.js';

type Deps = {
  db: Db;
  transactionManager: MongoTransactionManager;
};

const toObjectId = (value: ObjectIdSchema) =>
  value instanceof ObjectId ? value : new ObjectId(value.toString());

const ixModelsCollection = 'ixmodels';

const QUEUE_FIELD = 'processRun.findSuggestionsSharedIds';
const RUN_TIMESTAMP_FIELD = 'processRun.suggestionsRunTimestamp';
const INITIAL_COUNT_FIELD = 'processRun.findSuggestionsInitialSharedIdsCount';
const AUTO_ACCEPT_COHORT_FIELD = 'processRun.selectedSharedIdsForAutoAccept';
const AUTO_ACCEPT_TOTAL_FIELD = 'processRun.autoAcceptProgress.total';
const AUTO_ACCEPT_PROCESSED_FIELD = 'processRun.autoAcceptProgress.processed';

/** The queue as an aggregation expression, defaulted so a missing `processRun` reads as empty. */
const queueExpression = { $ifNull: [`$${QUEUE_FIELD}`, []] };

/**
 * Mongo implementation of {@link IXModelsDataSource}.
 *
 * Extends `MongoDataSource` rather than wrapping the mongoose model: its `SyncedCollection`
 * writes the same `{namespace, mongoId, timestamp, deleted}` rows to `updatelogs` that the
 * odm's `UpdateLogHelper` did — on inserts, on updates *and* on `findOneAndUpdate` — so
 * instance-to-instance sync is preserved across the swap. Pinned by the spec beside this file.
 *
 * `extractorId` is normalised to an `ObjectId` on the way into every query, matching what all
 * call sites already pass. It is deliberately *not* normalised in `save`, which stores the
 * value it is handed: `ProcessSuggestions` transiently writes a string there, and turning that
 * into an ObjectId here would be a behaviour change smuggled into a persistence swap. It is
 * recorded as a stage-5 finding instead.
 */
export class MongoIXModelsDataSource
  extends MongoDataSource<IXModel>
  implements IXModelsDataSource
{
  protected collectionName = ixModelsCollection;

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
  }

  async getByExtractorId(extractorId: ObjectIdSchema) {
    const model = await this.getCollection().findOne({ extractorId: toObjectId(extractorId) });
    return model ?? undefined;
  }

  async getById(id: ObjectIdSchema) {
    const model = await this.getCollection().findOne({ _id: toObjectId(id) as any });
    return model ?? undefined;
  }

  async save(model: Partial<IXModelType>) {
    const { _id, ...fields } = model;

    if (_id) {
      const existing = await this.getCollection().findOne({ _id: toObjectId(_id) as any });
      if (existing) {
        const saved = await this.getCollection().findOneAndUpdate(
          { _id: toObjectId(_id) as any },
          { $set: fields as any },
          { returnDocument: 'after' }
        );
        return saved as IXModel;
      }
    }

    const toInsert = _id ? { ...fields, _id: toObjectId(_id) } : fields;
    const { insertedId } = await this.getCollection().insertOne(toInsert as any);
    return { ...toInsert, _id: insertedId } as unknown as IXModel;
  }

  /* ------------------------------------------------------------- status transitions -- */

  async markTraining(
    extractorId: ObjectIdSchema,
    { maxSuggestionsToFind }: { maxSuggestionsToFind: number }
  ) {
    await this.getCollection().updateOne(
      { extractorId: toObjectId(extractorId) },
      {
        $set: {
          extractorId: toObjectId(extractorId),
          findingSuggestions: true,
          status: ModelStatus.processing,
          maxSuggestionsToFind,
        },
        $unset: { processRun: '' },
      } as any,
      { upsert: true }
    );
  }

  async markFindingSuggestions(extractorId: ObjectIdSchema) {
    const updated = await this.getCollection().findOneAndUpdate(
      { extractorId: toObjectId(extractorId) },
      { $set: { findingSuggestions: true, status: ModelStatus.processing } } as any,
      { returnDocument: 'after' }
    );
    return (updated as IXModel) ?? undefined;
  }

  async markReady(extractorId: ObjectIdSchema) {
    const updated = await this.getCollection().findOneAndUpdate(
      { extractorId: toObjectId(extractorId) },
      {
        $set: { findingSuggestions: false, status: ModelStatus.ready },
        $unset: {
          [RUN_TIMESTAMP_FIELD]: '',
          [QUEUE_FIELD]: '',
          [INITIAL_COUNT_FIELD]: '',
        },
      } as any,
      { returnDocument: 'after' }
    );
    return (updated as IXModel) ?? undefined;
  }

  /* -------------------------------------------------------------------- process run -- */

  async setProcessRun(extractorId: ObjectIdSchema, processRun: IXModelType['processRun']) {
    await this.getCollection().updateOne({ extractorId: toObjectId(extractorId) }, {
      $set: { processRun },
    } as any);
  }

  async clearProcessRun(extractorId: ObjectIdSchema) {
    await this.getCollection().updateOne({ extractorId: toObjectId(extractorId) }, {
      $unset: { processRun: '' },
    } as any);
  }

  async clearFindRunQueue(modelId: ObjectIdSchema) {
    await this.getCollection().updateOne({ _id: toObjectId(modelId) as any }, {
      $unset: {
        [RUN_TIMESTAMP_FIELD]: '',
        [QUEUE_FIELD]: '',
        [INITIAL_COUNT_FIELD]: '',
      },
    } as any);
  }

  async initializeFindRunQueue(
    modelId: ObjectIdSchema,
    {
      pendingIds,
      selectedSharedIds,
      runTimestamp,
    }: { pendingIds: string[]; selectedSharedIds: string[]; runTimestamp: number }
  ) {
    await this.getCollection().updateOne({ _id: toObjectId(modelId) as any }, {
      $set: {
        [RUN_TIMESTAMP_FIELD]: runTimestamp,
        [QUEUE_FIELD]: pendingIds,
        findingSuggestions: true,
        [INITIAL_COUNT_FIELD]: selectedSharedIds.length,
        // Persist the entire cohort to support auto-accept of pre-existing ready suggestions
        [AUTO_ACCEPT_COHORT_FIELD]: selectedSharedIds,
      },
    } as any);
  }

  /**
   * `$setUnion` plus a count delta computed in the database, so concurrent appends cannot
   * lose ids. In Postgres this becomes a read-modify-write inside a transaction; the port
   * hides the difference.
   */
  async appendToFindRunQueue(modelId: ObjectIdSchema, sharedIds: string[]) {
    const unioned = { $setUnion: [queueExpression, sharedIds] };
    await this.getCollection().updateOne({ _id: toObjectId(modelId) as any }, [
      {
        $set: {
          [QUEUE_FIELD]: unioned,
          findingSuggestions: true,
          [INITIAL_COUNT_FIELD]: {
            $add: [
              { $ifNull: [`$${INITIAL_COUNT_FIELD}`, 0] },
              { $subtract: [{ $size: unioned }, { $size: queueExpression }] },
            ],
          },
        },
      },
    ] as any);
  }

  async takeFromFindRunQueue(modelId: ObjectIdSchema, batchSize: number) {
    const before = await this.getCollection().findOneAndUpdate(
      { _id: toObjectId(modelId) as any },
      [
        {
          $set: {
            // Keep everything from `batchSize` onwards. `$slice`'s count must be positive, and
            // any count at least as large as the remainder yields exactly the remainder.
            [QUEUE_FIELD]: {
              $slice: [queueExpression, batchSize, { $max: [{ $size: queueExpression }, 1] }],
            },
          },
        },
      ] as any,
      { returnDocument: 'before' }
    );

    const queue = (before as IXModel | null)?.processRun?.findSuggestionsSharedIds ?? [];
    return queue.slice(0, batchSize);
  }

  async setAutoAcceptProgress(
    extractorId: ObjectIdSchema,
    progress: { total?: number; processed?: number }
  ) {
    const update: Record<string, number> = {};
    if (typeof progress.total === 'number') {
      update[AUTO_ACCEPT_TOTAL_FIELD] = progress.total;
    }
    if (typeof progress.processed === 'number') {
      update[AUTO_ACCEPT_PROCESSED_FIELD] = progress.processed;
    }
    if (!Object.keys(update).length) {
      return;
    }

    await this.getCollection().updateOne({ extractorId: toObjectId(extractorId) }, {
      $set: update,
    } as any);
  }

  async incrementAutoAcceptProcessed(extractorId: ObjectIdSchema, by: number) {
    await this.getCollection().updateOne({ extractorId: toObjectId(extractorId) }, {
      $inc: { [AUTO_ACCEPT_PROCESSED_FIELD]: by },
    } as any);
  }

  async setSamplePolicy(
    extractorId: ObjectIdSchema,
    samplePolicy: 'only_marked' | 'marked_plus_labeled'
  ) {
    await this.getCollection().updateOne({ extractorId: toObjectId(extractorId) }, {
      $set: { 'processRun.samplePolicy': samplePolicy },
    } as any);
  }
}
