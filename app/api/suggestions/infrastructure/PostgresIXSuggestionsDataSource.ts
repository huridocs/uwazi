import { ObjectId } from 'mongodb';
import {
  PostgresDataSource,
  PostgresDataSourceDeps,
} from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresTable } from '#api/core/infrastructure/postgresql/common/PostgresTable.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import {
  AcceptanceQuery,
  EntityLanguagePair,
  IXSuggestionsDataSource,
  PendingStatusFilter,
} from '../domain/IXSuggestionsDataSource.js';
import { PostgresIXSuggestionsMapper } from './PostgresIXSuggestionsMapper.js';
import type { IXSuggestionsRow } from './PostgresIXSuggestionsRow.js';
import {
  acceptancePredicate,
  healthyPredicate,
  pendingPredicate,
  runPredicate,
  SqlFragment,
  stateFlagPredicate,
} from './postgresSuggestionPredicates.js';

type Deps = Omit<PostgresDataSourceDeps, 'sync'>;

type Query = PostgresTable<IXSuggestionsRow>;

const toHex = (id: ObjectIdSchema) => id.toString();

/**
 * For ids that arrive from outside. One that cannot be an ObjectId cannot match a stored row, so
 * it is dropped, as `MongoIXSuggestionsDataSource.toMatchableObjectIds` does.
 */
const toMatchableHex = (ids: ObjectIdSchema[]) =>
  ids
    .filter(id => ObjectId.isValid(id))
    .map(id => (id instanceof ObjectId ? id : new ObjectId(id.toString())).toHexString());

/** Parenthesised: `whereRaw` does not group, and a fragment may be an `OR` chain. */
const satisfying = (query: Query, { sql, bindings }: SqlFragment) =>
  query.whereRaw(`(${sql})`, bindings);

const toSuggestions = async (query: Query) =>
  (await query.all()).map(row => PostgresIXSuggestionsMapper.toDomain(row));

const toEntityIds = async (query: Query) =>
  (await query.distinct(['entityId']).all()).map(row => row.entityId);

/**
 * Postgres implementation of {@link IXSuggestionsDataSource}: the reads, counts and entity-id
 * sets. The writes and deletes arrive in slice 4b; until then they throw, and the factory does
 * not route here.
 *
 * Nested values are JSONB, as Mongo stores them. Information extraction data is not synced
 * between instances, so no write records an `updatelogs` row.
 */
export class PostgresIXSuggestionsDataSource
  extends PostgresDataSource<IXSuggestionsRow>
  implements IXSuggestionsDataSource
{
  constructor(deps: Deps) {
    super('ix_suggestions', deps);
  }

  /* ------------------------------------------------------------------------- reads -- */

  async getByIds(ids: ObjectIdSchema[]) {
    return toSuggestions(this.table.whereIn('_id', toMatchableHex(ids)));
  }

  async getIdsOwnedByExtractor(extractorId: ObjectIdSchema, ids: ObjectIdSchema[]) {
    const rows = await this.forExtractor(extractorId)
      .whereIn('_id', toMatchableHex(ids))
      .select(['_id'])
      .all();
    return rows.map(row => new ObjectId(row._id));
  }

  async getOneForEntity(query: {
    extractorId: ObjectIdSchema;
    entityId: string;
    language: string;
  }) {
    const { entityId, language } = query;
    const row = await this.forExtractor(query.extractorId).where({ entityId, language }).first();
    return row ? PostgresIXSuggestionsMapper.toDomain(row) : undefined;
  }

  async getOneForFile(query: {
    extractorId: ObjectIdSchema;
    entityId: string;
    fileId: ObjectIdSchema;
  }) {
    const row = await this.forExtractor(query.extractorId)
      .where({ entityId: query.entityId, fileId: toHex(query.fileId) })
      .first();
    return row ? PostgresIXSuggestionsMapper.toDomain(row) : undefined;
  }

  async getByFileIds(extractorId: ObjectIdSchema, fileIds: ObjectIdSchema[]) {
    return toSuggestions(this.forExtractor(extractorId).whereIn('fileId', fileIds.map(toHex)));
  }

  async getByEntityId(sharedId: string) {
    return toSuggestions(this.table.where({ entityId: sharedId }));
  }

  async getByEntityLanguagePairs(extractorId: ObjectIdSchema, pairs: EntityLanguagePair[]) {
    if (!pairs.length) {
      return [];
    }
    return toSuggestions(
      this.forExtractor(extractorId).whereAny(
        pairs.map(({ sharedId, language }) => ({ entityId: sharedId, language }))
      )
    );
  }

  async getTrainingMarked(extractorId: ObjectIdSchema) {
    const rows = await this.forExtractor(extractorId)
      .where({ useForTraining: true })
      .select(['entityId', 'language', 'fileId'])
      .all();

    return rows.map(({ entityId, language, fileId }) => ({
      entityId,
      language,
      ...(fileId ? { fileId: new ObjectId(fileId) } : {}),
    }));
  }

  async isMarkedForTraining(extractorId: ObjectIdSchema, entityId: string, language: string) {
    const marked = await this.forExtractor(extractorId)
      .where({ entityId, language, useForTraining: true })
      .select(['_id'])
      .first();
    return Boolean(marked);
  }

  /**
   * Ordered by `_id`: hex ids of equal length sort in ObjectId order under any collation, since
   * every collation puts digits before letters.
   */
  async getAcceptable(query: AcceptanceQuery, page: { limit: number; skip?: number }) {
    return toSuggestions(
      satisfying(this.table, acceptancePredicate(query))
        .select(['_id', 'entityId', 'entityLanguageId', 'state', 'modelData'])
        .orderBy('_id')
        .offset(page.skip ?? 0)
        .limit(page.limit)
    );
  }

  /* ------------------------------------------------------------------------ counts -- */

  async countAllForExtractor(extractorId: ObjectIdSchema) {
    return this.forExtractor(extractorId).count();
  }

  async countPendingForExtractor(extractorId: ObjectIdSchema, filter: PendingStatusFilter = {}) {
    return satisfying(this.forExtractor(extractorId), pendingPredicate(filter)).count();
  }

  async countPendingByLabel(extractorId: ObjectIdSchema, filter: PendingStatusFilter = {}) {
    const pending = satisfying(this.forExtractor(extractorId), pendingPredicate(filter));

    const [labeled, unlabeled] = await Promise.all([
      satisfying(pending, stateFlagPredicate('labeled', true)).count(),
      satisfying(pending, stateFlagPredicate('labeled', false)).count(),
    ]);

    return { labeled, unlabeled };
  }

  async countProcessedInRun(extractorId: ObjectIdSchema, runTimestamp: number) {
    const ready = this.forExtractor(extractorId).where({ status: 'ready' });
    return satisfying(satisfying(ready, healthyPredicate), runPredicate(runTimestamp)).count();
  }

  async countProcessedSince(extractorId: ObjectIdSchema, since: number) {
    return this.forExtractor(extractorId)
      .whereRaw('"date" IS NOT NULL AND "date" > ?', [since])
      .count();
  }

  async countAcceptable(query: AcceptanceQuery) {
    return satisfying(this.table, acceptancePredicate(query)).count();
  }

  /* ------------------------------------------------------------------ entity-id sets -- */

  async getEntityIdsSeenInRun(
    extractorId: ObjectIdSchema,
    candidateIds: string[],
    runTimestamp: number
  ) {
    const run = runPredicate(runTimestamp);
    return toEntityIds(
      this.forExtractor(extractorId)
        .whereIn('entityId', candidateIds)
        .whereRaw(`("status" = 'processing' OR ("status" = 'ready' AND ${run.sql}))`, run.bindings)
    );
  }

  async getEntityIdsWithHealthySuggestions(extractorId: ObjectIdSchema, entityIds: string[]) {
    return toEntityIds(
      satisfying(this.forExtractor(extractorId).whereIn('entityId', entityIds), healthyPredicate)
    );
  }

  async getEntityIdsWithObsoleteSuggestions(extractorId: ObjectIdSchema, entityIds: string[]) {
    return toEntityIds(
      satisfying(
        this.forExtractor(extractorId)
          .whereIn('entityId', entityIds)
          .whereRaw('"date" IS NOT NULL'),
        stateFlagPredicate('obsolete', true)
      )
    );
  }

  /* --------------------------------------------------------- writes, until slice 4b -- */

  async saveMultiple() {
    return this.notImplemented('saveMultiple');
  }

  async createMultiple() {
    return this.notImplemented('createMultiple');
  }

  async markObsoleteForExtractor() {
    return this.notImplemented('markObsoleteForExtractor');
  }

  async markProcessingAsFailed() {
    return this.notImplemented('markProcessingAsFailed');
  }

  async markProcessingAsObsolete() {
    return this.notImplemented('markProcessingAsObsolete');
  }

  async setUseForTraining() {
    return this.notImplemented('setUseForTraining');
  }

  async setStates() {
    return this.notImplemented('setStates');
  }

  async clearTrainingSamplesForExtractor() {
    return this.notImplemented('clearTrainingSamplesForExtractor');
  }

  async markTrainingSamples() {
    return this.notImplemented('markTrainingSamples');
  }

  async deleteByExtractorId() {
    return this.notImplemented('deleteByExtractorId');
  }

  async deleteByExtractorIds() {
    return this.notImplemented('deleteByExtractorIds');
  }

  async deleteByTemplatesAndExtractors() {
    return this.notImplemented('deleteByTemplatesAndExtractors');
  }

  async deleteByFileIds() {
    return this.notImplemented('deleteByFileIds');
  }

  async deleteByEntityId() {
    return this.notImplemented('deleteByEntityId');
  }

  async deleteByEntityAndTemplate() {
    return this.notImplemented('deleteByEntityAndTemplate');
  }

  private forExtractor(extractorId: ObjectIdSchema) {
    return this.table.where({ extractorId: toHex(extractorId) });
  }

  private notImplemented(method: string): never {
    throw new Error(`${this.constructor.name}.${method} is not implemented until slice 4b`);
  }
}
