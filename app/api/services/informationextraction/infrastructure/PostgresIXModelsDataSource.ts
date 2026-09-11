import { ObjectId } from 'mongodb';
import {
  PostgresDataSource,
  PostgresDataSourceDeps,
} from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { IXModelType } from '#shared/types/IXModelType.js';
import { ModelStatus } from '#shared/types/IXModelSchema.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { IXModel, IXModelsDataSource } from '../domain/IXModelsDataSource.js';
import { PostgresIXModelsMapper } from './PostgresIXModelsMapper.js';
import type { IXModelsRow } from './PostgresIXModelsRow.js';

type Deps = Omit<PostgresDataSourceDeps, 'sync'>;

type Key = { column: '_id' | 'extractorId'; id: ObjectIdSchema };

const toHex = (id: ObjectIdSchema) => id.toString();

/** The per-run queue keys of `processRun`, dropped together when a run ends. */
const RUN_QUEUE_KEYS = [
  'suggestionsRunTimestamp',
  'findSuggestionsSharedIds',
  'findSuggestionsInitialSharedIdsCount',
];

/** `processRun`, or an empty object when the model has none, so keys can be merged into it. */
const PROCESS_RUN = `COALESCE("processRun", '{}'::jsonb)`;

/** `processRun.autoAcceptProgress`, merged over, since `jsonb_set` does not create parents. */
const withAutoAcceptProgress = (progress: string) =>
  `${PROCESS_RUN} || jsonb_build_object('autoAcceptProgress', COALESCE("processRun"->'autoAcceptProgress', '{}'::jsonb) || ${progress})`;

/**
 * Postgres implementation of {@link IXModelsDataSource}.
 *
 * `processRun` is JSONB, as Mongo stores it, and each named mutation of it is one UPDATE. The two
 * queue operations lock the row in a `FOR UPDATE` subquery, so concurrent takes and appends
 * serialise instead of losing ids. Information extraction data is not synced between instances,
 * so no write records an `updatelogs` row.
 */
export class PostgresIXModelsDataSource
  extends PostgresDataSource<IXModelsRow>
  implements IXModelsDataSource
{
  constructor(deps: Deps) {
    super('ix_models', deps);
  }

  async getByExtractorId(extractorId: ObjectIdSchema) {
    const row = await this.table.where({ extractorId: toHex(extractorId) }).first();
    return row ? PostgresIXModelsMapper.toDomain(row) : undefined;
  }

  async getById(id: ObjectIdSchema) {
    const row = await this.table.where({ _id: toHex(id) }).first();
    return row ? PostgresIXModelsMapper.toDomain(row) : undefined;
  }

  async save(model: Partial<IXModelType>) {
    const { _id, ...changes } = PostgresIXModelsMapper.toRow(model);

    if (!_id || !(await this.updateExisting(_id, changes))) {
      const row = { ...changes, _id: _id ?? new ObjectId().toString() };
      await this.table.insert(row);
      return (await this.getById(row._id))!;
    }

    return (await this.getById(_id))!;
  }

  /* ------------------------------------------------------------- status transitions -- */

  async markTraining(
    extractorId: ObjectIdSchema,
    { maxSuggestionsToFind }: { maxSuggestionsToFind: number }
  ) {
    await this.table.upsert(
      {
        _id: new ObjectId().toString(),
        extractorId: toHex(extractorId),
        status: ModelStatus.processing,
        findingSuggestions: true,
        maxSuggestionsToFind,
        processRun: null,
      },
      {
        columns: ['tenant_id', 'extractorId'],
        merge: ['status', 'findingSuggestions', 'maxSuggestionsToFind', 'processRun'],
      }
    );
  }

  async markFindingSuggestions(extractorId: ObjectIdSchema) {
    return this.updateReturning(
      { column: 'extractorId', id: extractorId },
      '"findingSuggestions" = true, "status" = ?',
      [ModelStatus.processing]
    );
  }

  async markReady(extractorId: ObjectIdSchema) {
    return this.updateReturning(
      { column: 'extractorId', id: extractorId },
      '"findingSuggestions" = false, "status" = ?, "processRun" = "processRun" - ?::text[]',
      [ModelStatus.ready, RUN_QUEUE_KEYS]
    );
  }

  /* -------------------------------------------------------------------- process run -- */

  async setProcessRun(extractorId: ObjectIdSchema, processRun: IXModelType['processRun']) {
    await this.updateReturning(
      { column: 'extractorId', id: extractorId },
      '"processRun" = ?::jsonb',
      [processRun === undefined ? null : JSON.stringify(processRun)]
    );
  }

  async clearProcessRun(extractorId: ObjectIdSchema) {
    await this.updateReturning({ column: 'extractorId', id: extractorId }, '"processRun" = NULL');
  }

  async clearFindRunQueue(modelId: ObjectIdSchema) {
    await this.updateReturning(
      { column: '_id', id: modelId },
      '"processRun" = "processRun" - ?::text[]',
      [RUN_QUEUE_KEYS]
    );
  }

  async initializeFindRunQueue(
    modelId: ObjectIdSchema,
    {
      pendingIds,
      selectedSharedIds,
      runTimestamp,
    }: { pendingIds: string[]; selectedSharedIds: string[]; runTimestamp: number }
  ) {
    const run = {
      suggestionsRunTimestamp: runTimestamp,
      findSuggestionsSharedIds: pendingIds,
      findSuggestionsInitialSharedIdsCount: selectedSharedIds.length,
      // Persist the entire cohort to support auto-accept of pre-existing ready suggestions
      selectedSharedIdsForAutoAccept: selectedSharedIds,
    };

    await this.updateReturning(
      { column: '_id', id: modelId },
      `"findingSuggestions" = true, "processRun" = ${PROCESS_RUN} || ?::jsonb`,
      [JSON.stringify(run)]
    );
  }

  /** Union computed from the locked row; the initial count grows by the ids that were new. */
  async appendToFindRunQueue(modelId: ObjectIdSchema, sharedIds: string[]) {
    await this.table.raw(
      `UPDATE ?? AS m
       SET "findingSuggestions" = true,
           "processRun" = COALESCE(m."processRun", '{}'::jsonb) || jsonb_build_object(
             'findSuggestionsSharedIds', unioned.ids,
             'findSuggestionsInitialSharedIdsCount',
               COALESCE((m."processRun"->>'findSuggestionsInitialSharedIdsCount')::numeric, 0)
               + jsonb_array_length(unioned.ids) - jsonb_array_length(locked.queue)
           )
       FROM (
         SELECT "_id", "tenant_id",
                COALESCE("processRun"->'findSuggestionsSharedIds', '[]'::jsonb) AS queue
         FROM ?? WHERE "_id" = ? AND "tenant_id" = ?
         FOR UPDATE
       ) AS locked,
       LATERAL (
         SELECT COALESCE(jsonb_agg(DISTINCT candidates.id), '[]'::jsonb) AS ids
         FROM (
           SELECT jsonb_array_elements_text(locked.queue)
           UNION
           SELECT unnest(?::text[])
         ) AS candidates(id)
       ) AS unioned
       WHERE m."_id" = locked."_id" AND m."tenant_id" = locked."tenant_id"`,
      [this.table.tableName, this.table.tableName, toHex(modelId), this.table.tenantId, sharedIds]
    );
  }

  /** Returns the queue as the locked row held it; the row keeps everything after `batchSize`. */
  async takeFromFindRunQueue(modelId: ObjectIdSchema, batchSize: number) {
    const result = await this.table.raw<{ rows: { queue: string[] }[] }>(
      `UPDATE ?? AS m
       SET "processRun" = COALESCE(m."processRun", '{}'::jsonb) || jsonb_build_object(
         'findSuggestionsSharedIds',
         COALESCE(
           (SELECT jsonb_agg(queued.id ORDER BY queued.idx)
            FROM jsonb_array_elements(locked.queue) WITH ORDINALITY AS queued(id, idx)
            WHERE queued.idx > ?),
           '[]'::jsonb
         )
       )
       FROM (
         SELECT "_id", "tenant_id",
                COALESCE("processRun"->'findSuggestionsSharedIds', '[]'::jsonb) AS queue
         FROM ?? WHERE "_id" = ? AND "tenant_id" = ?
         FOR UPDATE
       ) AS locked
       WHERE m."_id" = locked."_id" AND m."tenant_id" = locked."tenant_id"
       RETURNING locked.queue`,
      [this.table.tableName, batchSize, this.table.tableName, toHex(modelId), this.table.tenantId]
    );

    const [row] = result.rows;
    return row ? row.queue.slice(0, batchSize) : [];
  }

  async setAutoAcceptProgress(
    extractorId: ObjectIdSchema,
    progress: { total?: number; processed?: number }
  ) {
    const counters = Object.fromEntries(
      Object.entries(progress).filter(([, value]) => typeof value === 'number')
    );
    if (!Object.keys(counters).length) {
      return;
    }

    await this.updateReturning(
      { column: 'extractorId', id: extractorId },
      `"processRun" = ${withAutoAcceptProgress('?::jsonb')}`,
      [JSON.stringify(counters)]
    );
  }

  async incrementAutoAcceptProcessed(extractorId: ObjectIdSchema, by: number) {
    const processed = `jsonb_build_object('processed', COALESCE(("processRun"->'autoAcceptProgress'->>'processed')::numeric, 0) + ?)`;

    await this.updateReturning(
      { column: 'extractorId', id: extractorId },
      `"processRun" = ${withAutoAcceptProgress(processed)}`,
      [by]
    );
  }

  async setSamplePolicy(
    extractorId: ObjectIdSchema,
    samplePolicy: 'only_marked' | 'marked_plus_labeled'
  ) {
    await this.updateReturning(
      { column: 'extractorId', id: extractorId },
      `"processRun" = ${PROCESS_RUN} || jsonb_build_object('samplePolicy', ?::text)`,
      [samplePolicy]
    );
  }

  /** Whether a row with this id exists, updating the given columns on it when there are any. */
  private async updateExisting(_id: string, changes: Partial<IXModelsRow>) {
    if (!Object.keys(changes).length) {
      return Boolean(await this.table.where({ _id }).first());
    }
    return (await this.table.where({ _id }).update(changes)).length > 0;
  }

  /** One atomic `UPDATE … RETURNING` on the model matched by `key`; `set` binds `bindings`. */
  private async updateReturning(
    key: Key,
    set: string,
    bindings: unknown[] = []
  ): Promise<IXModel | undefined> {
    const result = await this.table.raw<{ rows: IXModelsRow[] }>(
      `UPDATE ?? SET ${set} WHERE ?? = ? AND "tenant_id" = ? RETURNING *`,
      [this.table.tableName, ...bindings, key.column, toHex(key.id), this.table.tenantId]
    );

    const [row] = result.rows;
    return row ? PostgresIXModelsMapper.toDomain(row) : undefined;
  }
}
