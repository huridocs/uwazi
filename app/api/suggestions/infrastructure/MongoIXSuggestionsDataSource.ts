/* eslint-disable max-lines */
import { Db, Filter, ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { IXSuggestionType } from '#shared/types/suggestionType.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import {
  AcceptanceQuery,
  EntityLanguagePair,
  IXSuggestionsDataSource,
  PendingStatusFilter,
  Suggestion,
} from '../domain/IXSuggestionsDataSource.js';

type Deps = {
  db: Db;
  transactionManager: MongoTransactionManager;
};

const toObjectId = (value: ObjectIdSchema) =>
  value instanceof ObjectId ? value : new ObjectId(value.toString());

const toObjectIds = (values: ObjectIdSchema[]) => values.map(toObjectId);

/**
 * For ids that arrive from outside — an HTTP body, say. An id that cannot be an ObjectId cannot
 * match a stored document, so it is dropped rather than thrown on: `new ObjectId('any')` raises a
 * BSON error that surfaces to the user as an empty message, where the mongoose model this
 * replaces produced a catchable cast error. Dropping it lets the caller's own "not found" rule
 * answer instead, which is the domain error the user should see.
 */
const toMatchableObjectIds = (values: ObjectIdSchema[]) =>
  values.filter(value => ObjectId.isValid(value)).map(toObjectId);

const ixSuggestionsCollection = 'ixsuggestions';

/**
 * Defaults the mongoose schema applied on insert. Unlike the other two IX models,
 * `IXSuggestionsModel` declares real properties — `status` defaults to `'processing'` and
 * `useForTraining` to `false` — so a raw driver insert would silently produce documents of a
 * different shape than every existing row. Pinned by a spec.
 */
const withInsertDefaults = (suggestion: Partial<IXSuggestionType>) => ({
  status: 'processing',
  useForTraining: false,
  ...suggestion,
});

/** Dated, and neither obsolete nor errored — what "this suggestion actually answered" means. */
const healthy = {
  date: { $ne: null },
  'state.obsolete': { $ne: true },
  'state.error': { $ne: true },
};

/** The suggestions auto-acceptance may take, as a mongo filter. */
const acceptanceMatch = ({ extractorId, scope, includeAlreadyValued }: AcceptanceQuery) => {
  const match: Record<string, unknown> = {
    extractorId: toObjectId(extractorId),
    status: 'ready',
    'state.withSuggestion': true,
    ...healthy,
  };

  if (!includeAlreadyValued) {
    match['state.withValue'] = { $ne: true };
  }

  if (scope.kind === 'entities') {
    match.entityId = { $in: scope.entityIds };
  }

  if (scope.kind === 'run') {
    match['modelData.suggestionsRunTimestamp'] = scope.runTimestamp;
  }

  return match as Filter<Suggestion>;
};

/**
 * Mongo implementation of {@link IXSuggestionsDataSource}.
 *
 * Extends `MongoDataSource` rather than wrapping the mongoose model: its `SyncedCollection`
 * writes the same `{namespace, mongoId, timestamp, deleted}` rows to `updatelogs` that the odm's
 * `UpdateLogHelper` did, so instance-to-instance sync is preserved. Pinned by the spec beside
 * this file.
 */
export class MongoIXSuggestionsDataSource
  extends MongoDataSource<Suggestion>
  implements IXSuggestionsDataSource
{
  protected collectionName = ixSuggestionsCollection;

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
  }

  /* ------------------------------------------------------------------------- reads -- */

  async getByIds(ids: ObjectIdSchema[]) {
    return this.getCollection()
      .find({ _id: { $in: toMatchableObjectIds(ids) } as any })
      .toArray();
  }

  async getIdsOwnedByExtractor(extractorId: ObjectIdSchema, ids: ObjectIdSchema[]) {
    const owned = await this.getCollection()
      .find(
        { _id: { $in: toMatchableObjectIds(ids) } as any, extractorId: toObjectId(extractorId) },
        { projection: { _id: 1 } }
      )
      .toArray();
    return owned.map(suggestion => suggestion._id);
  }

  async getOneForEntity({
    extractorId,
    entityId,
    language,
  }: {
    extractorId: ObjectIdSchema;
    entityId: string;
    language: string;
  }) {
    const suggestion = await this.getCollection().findOne({
      extractorId: toObjectId(extractorId),
      entityId,
      language,
    });
    return suggestion ?? undefined;
  }

  async getOneForFile({
    extractorId,
    entityId,
    fileId,
  }: {
    extractorId: ObjectIdSchema;
    entityId: string;
    fileId: ObjectIdSchema;
  }) {
    const suggestion = await this.getCollection().findOne({
      extractorId: toObjectId(extractorId),
      entityId,
      fileId: toObjectId(fileId) as any,
    });
    return suggestion ?? undefined;
  }

  async getByFileIds(extractorId: ObjectIdSchema, fileIds: ObjectIdSchema[]) {
    return this.getCollection()
      .find({
        extractorId: toObjectId(extractorId),
        fileId: { $in: toObjectIds(fileIds) } as any,
      })
      .toArray();
  }

  async getByEntityLanguagePairs(extractorId: ObjectIdSchema, pairs: EntityLanguagePair[]) {
    return this.getCollection()
      .find({
        extractorId: toObjectId(extractorId),
        $or: pairs.map(({ sharedId, language }) => ({ entityId: sharedId, language })),
      } as Filter<Suggestion>)
      .toArray();
  }

  async getTrainingMarked(extractorId: ObjectIdSchema) {
    const marked = await this.getCollection()
      .find(
        { extractorId: toObjectId(extractorId), useForTraining: true },
        { projection: { entityId: 1, language: 1, fileId: 1 } }
      )
      .toArray();

    return marked.map(({ entityId, language, fileId }) => ({ entityId, language, fileId }));
  }

  async isMarkedForTraining(extractorId: ObjectIdSchema, entityId: string, language: string) {
    const marked = await this.getCollection().findOne(
      { extractorId: toObjectId(extractorId), entityId, language, useForTraining: true },
      { projection: { _id: 1 } }
    );
    return !!marked;
  }

  async getAcceptable(query: AcceptanceQuery, page: { limit: number; skip?: number }) {
    return this.getCollection()
      .find(acceptanceMatch(query), {
        projection: { _id: 1, entityId: 1, entityLanguageId: 1, state: 1, modelData: 1 },
        sort: { _id: 1 },
        skip: page.skip,
        limit: page.limit,
      })
      .toArray();
  }

  /* ------------------------------------------------------------------------ counts -- */

  async countAllForExtractor(extractorId: ObjectIdSchema) {
    return this.getCollection().countDocuments({ extractorId: toObjectId(extractorId) });
  }

  async countPendingForExtractor(extractorId: ObjectIdSchema, filter: PendingStatusFilter = {}) {
    const selected = filter.nonProcessed || filter.obsolete || filter.error;
    const include = (status: keyof PendingStatusFilter) => !selected || filter[status];

    const matchAny = [
      include('nonProcessed') ? { date: null } : null,
      include('obsolete') ? { date: { $ne: null }, 'state.obsolete': true } : null,
      include('error') ? { date: { $ne: null }, 'state.error': true } : null,
    ].filter(Boolean);

    return this.getCollection().countDocuments({
      extractorId: toObjectId(extractorId),
      $or: matchAny,
    } as any);
  }

  async countProcessedInRun(extractorId: ObjectIdSchema, runTimestamp: number) {
    return this.getCollection().countDocuments({
      extractorId: toObjectId(extractorId),
      status: 'ready',
      ...healthy,
      'modelData.suggestionsRunTimestamp': runTimestamp,
    } as any);
  }

  async countProcessedSince(extractorId: ObjectIdSchema, since: number) {
    return this.getCollection().countDocuments({
      extractorId: toObjectId(extractorId),
      $and: [{ date: { $ne: null } }, { date: { $gt: since } }],
    } as any);
  }

  async countAcceptable(query: AcceptanceQuery) {
    return this.getCollection().countDocuments(acceptanceMatch(query) as any);
  }

  /* ------------------------------------------------------------------ entity-id sets -- */

  async getEntityIdsSeenInRun(
    extractorId: ObjectIdSchema,
    candidateIds: string[],
    runTimestamp: number
  ) {
    const base = {
      extractorId: toObjectId(extractorId),
      entityId: { $in: candidateIds },
    };

    const [queuedNow, readyThisRun] = await Promise.all([
      this.getCollection().distinct('entityId', { ...base, status: 'processing' } as any),
      this.getCollection().distinct('entityId', {
        ...base,
        'modelData.suggestionsRunTimestamp': runTimestamp,
        status: 'ready',
      } as any),
    ]);

    return Array.from(new Set<string>([...queuedNow, ...readyThisRun]));
  }

  async getEntityIdsWithHealthySuggestions(extractorId: ObjectIdSchema, entityIds: string[]) {
    return this.getCollection().distinct('entityId', {
      extractorId: toObjectId(extractorId),
      entityId: { $in: entityIds },
      ...healthy,
    } as any);
  }

  async getEntityIdsWithObsoleteSuggestions(extractorId: ObjectIdSchema, entityIds: string[]) {
    return this.getCollection().distinct('entityId', {
      extractorId: toObjectId(extractorId),
      entityId: { $in: entityIds },
      date: { $ne: null },
      'state.obsolete': true,
    } as any);
  }

  /* ------------------------------------------------------------------------ writes -- */

  async saveMultiple(suggestions: Partial<IXSuggestionType>[]) {
    const withIds = suggestions.map(suggestion => ({
      suggestion,
      _id: suggestion._id ? toObjectId(suggestion._id) : new ObjectId(),
      isNew: !suggestion._id,
    }));

    const candidateIds = withIds.filter(s => !s.isNew).map(s => s._id);
    const found = candidateIds.length
      ? await this.getCollection()
          .find({ _id: { $in: candidateIds } as any }, { projection: { _id: 1 } })
          .toArray()
      : [];
    const existing = new Set(found.map(suggestion => suggestion._id.toString()));

    const operations = withIds.map(({ suggestion, _id, isNew }) => {
      if (!isNew && existing.has(_id.toString())) {
        const { _id: _ignored, ...fields } = suggestion;
        return { updateOne: { filter: { _id }, update: { $set: fields } } };
      }
      return { insertOne: { document: withInsertDefaults({ ...suggestion, _id }) } };
    });

    if (!operations.length) {
      return [];
    }

    await this.getCollection().bulkWrite(operations as any);
    return this.getByIds(withIds.map(s => s._id));
  }

  async createMultiple(suggestions: Partial<IXSuggestionType>[]) {
    if (!suggestions.length) {
      return;
    }
    await this.getCollection().insertMany(suggestions.map(withInsertDefaults) as any);
  }

  async markObsoleteForExtractor(extractorId: ObjectIdSchema) {
    await this.getCollection().updateMany(
      { extractorId: toObjectId(extractorId) } as any,
      {
        $set: { 'state.obsolete': true, 'state.match': null },
      } as any
    );
  }

  async markProcessingAsFailed(extractorId: ObjectIdSchema, errorMessage: string) {
    await this.getCollection().updateMany(
      { extractorId: toObjectId(extractorId), status: 'processing' } as any,
      {
        $set: {
          status: 'failed',
          error: errorMessage,
          'state.processing': false,
          'state.error': true,
          'state.match': null,
          'state.withSuggestion': false,
          'state.hasContext': false,
        },
      } as any
    );
  }

  async setUseForTraining(ids: ObjectIdSchema[], useForTraining: boolean) {
    await this.getCollection().updateMany({ _id: { $in: toObjectIds(ids) } as any }, {
      $set: { useForTraining },
    } as any);
  }

  async clearTrainingSamplesForExtractor(extractorId: ObjectIdSchema) {
    await this.getCollection().updateMany(
      { extractorId: toObjectId(extractorId) } as any,
      {
        $set: { trainingSample: false },
      } as any
    );
  }

  async markTrainingSamples(extractorId: ObjectIdSchema, entityIds: string[]) {
    await this.getCollection().updateMany(
      { extractorId: toObjectId(extractorId), entityId: { $in: entityIds } } as any,
      { $set: { trainingSample: true } } as any
    );
  }

  /* ----------------------------------------------------------------------- deletes -- */

  async deleteByExtractorId(extractorId: ObjectIdSchema) {
    await this.getCollection().deleteMany({ extractorId: toObjectId(extractorId) } as any);
  }

  async deleteByExtractorIds(extractorIds: ObjectIdSchema[]) {
    await this.getCollection().deleteMany({
      extractorId: { $in: toObjectIds(extractorIds) } as any,
    });
  }

  async deleteByTemplatesAndExtractors(templateIds: string[], extractorIds: ObjectIdSchema[]) {
    await this.getCollection().deleteMany({
      entityTemplate: { $in: templateIds } as any,
      extractorId: { $in: toObjectIds(extractorIds) } as any,
    });
  }

  async deleteByFileIds(fileIds: ObjectIdSchema[]) {
    await this.getCollection().deleteMany({ fileId: { $in: toObjectIds(fileIds) } as any });
  }

  async deleteByEntityId(sharedId: string) {
    await this.getCollection().deleteMany({ entityId: sharedId } as any);
  }

  async deleteByEntityAndTemplate(sharedId: string, templateId: string) {
    await this.getCollection().deleteMany({
      entityId: sharedId,
      entityTemplate: templateId,
    } as any);
  }
}
