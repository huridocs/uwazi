import { ObjectId } from 'mongodb';
import {
  PostgresDataSource,
  PostgresDataSourceDeps,
} from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { IXSuggestionStateType, IXSuggestionType } from '#shared/types/suggestionType.js';
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
  obsoletePredicate,
  pendingPredicate,
  runPredicate,
  stateFlagPredicate,
} from './postgresSuggestionPredicates.js';
import {
  satisfying,
  toEntityIds,
  toHex,
  toMatchableHex,
  toSuggestions,
} from './postgresSuggestionQueries.js';
import {
  failProcessing,
  insertRows,
  markObsolete,
  releaseProcessingAsObsolete,
  updateRows,
  upsertRows,
} from './postgresSuggestionWrites.js';

type Deps = Omit<PostgresDataSourceDeps, 'sync'>;

/**
 * Postgres implementation of {@link IXSuggestionsDataSource}.
 *
 * Nested values are JSONB, as Mongo stores them; state merges are single JSONB `||` updates.
 * Information extraction data is not synced between instances, so no write records an
 * `updatelogs` row.
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
      satisfying(this.forExtractor(extractorId).whereIn('entityId', entityIds), obsoletePredicate)
    );
  }

  /* ------------------------------------------------------------------------ writes -- */

  /** Upsert by `_id`: existing rows take only the given fields, the rest are inserted. */
  async saveMultiple(suggestions: Partial<IXSuggestionType>[]) {
    const rows = suggestions.map(suggestion =>
      PostgresIXSuggestionsMapper.toRow({ ...suggestion, _id: suggestion._id ?? new ObjectId() })
    );
    await upsertRows(this.table, rows);
    return rows.length ? this.getByIds(rows.map(({ _id }) => _id!)) : [];
  }

  /**
   * Insert only. A row repeating a natural key — one suggestion per entity and language for a text
   * source, one per file for a pdf source — fails on the unique index here, where Mongo stored the
   * duplicate. That failure is left to surface.
   */
  async createMultiple(suggestions: Partial<IXSuggestionType>[]) {
    await insertRows(
      this.table,
      suggestions.map(s => PostgresIXSuggestionsMapper.toRow(s))
    );
  }

  async markObsoleteForExtractor(extractorId: ObjectIdSchema) {
    await markObsolete(this.table, toHex(extractorId));
  }

  async markProcessingAsFailed(extractorId: ObjectIdSchema, errorMessage: string) {
    await failProcessing(this.table, toHex(extractorId), errorMessage);
  }

  async markProcessingAsObsolete(extractorId: ObjectIdSchema) {
    await releaseProcessingAsObsolete(this.table, toHex(extractorId));
  }

  async setUseForTraining(ids: ObjectIdSchema[], useForTraining: boolean) {
    await this.table.whereIn('_id', ids.map(toHex)).update({ useForTraining });
  }

  async setStates(updates: { id: ObjectIdSchema; state: IXSuggestionStateType }[]) {
    await updateRows(
      this.table,
      updates.map(({ id, state }) => PostgresIXSuggestionsMapper.toRow({ _id: id, state }))
    );
  }

  async clearTrainingSamplesForExtractor(extractorId: ObjectIdSchema) {
    await this.forExtractor(extractorId).update({ trainingSample: false });
  }

  async markTrainingSamples(extractorId: ObjectIdSchema, entityIds: string[]) {
    await this.forExtractor(extractorId)
      .whereIn('entityId', entityIds)
      .update({ trainingSample: true });
  }

  /* ----------------------------------------------------------------------- deletes -- */

  async deleteByExtractorId(extractorId: ObjectIdSchema) {
    await this.forExtractor(extractorId).delete();
  }

  async deleteByExtractorIds(extractorIds: ObjectIdSchema[]) {
    await this.table.whereIn('extractorId', extractorIds.map(toHex)).delete();
  }

  async deleteByTemplatesAndExtractors(templateIds: string[], extractorIds: ObjectIdSchema[]) {
    await this.table
      .whereIn('entityTemplate', templateIds)
      .whereIn('extractorId', extractorIds.map(toHex))
      .delete();
  }

  async deleteByFileIds(fileIds: ObjectIdSchema[]) {
    await this.table.whereIn('fileId', fileIds.map(toHex)).delete();
  }

  async deleteByEntityId(sharedId: string) {
    await this.table.where({ entityId: sharedId }).delete();
  }

  async deleteByEntityAndTemplate(sharedId: string, templateId: string) {
    await this.table.where({ entityId: sharedId, entityTemplate: templateId }).delete();
  }

  private forExtractor(extractorId: ObjectIdSchema) {
    return this.table.where({ extractorId: toHex(extractorId) });
  }
}
